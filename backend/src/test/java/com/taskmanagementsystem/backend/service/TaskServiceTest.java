package com.taskmanagementsystem.backend.service;

import com.taskmanagementsystem.backend.dto.TaskRequest;
import com.taskmanagementsystem.backend.dto.TaskResponse;
import com.taskmanagementsystem.backend.entity.*;
import com.taskmanagementsystem.backend.repository.ProjectRepository;
import com.taskmanagementsystem.backend.repository.TaskRepository;
import com.taskmanagementsystem.backend.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskService")
class TaskServiceTest {

    @Mock TaskRepository    taskRepository;
    @Mock ProjectRepository projectRepository;
    @Mock UserRepository    userRepository;

    @InjectMocks TaskService taskService;

    private User    assignee;
    private Project project;
    private Task    task;

    @BeforeEach
    void setUp() {
        assignee = User.builder()
                .id(10L).name("Bob Dev").email("bob@company.com").password("hash").build();

        project = new Project();
        project.setId(5L);
        project.setName("TaskFlow");
        project.setUser(assignee);

        task = Task.builder()
                .id(1L)
                .title("Fix login bug")
                .description("Users cannot log in with OAuth")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .assignee(assignee)
                .deadline(LocalDate.of(2025, 12, 31))
                .project(project)
                .build();
    }

    // ── getTasksByProject() ───────────────────────────────────────────────

    @Nested
    @DisplayName("getTasksByProject()")
    class GetTasksByProject {

        @Test
        @DisplayName("should return a list of TaskResponse for an existing project")
        void getTasksByProject_success() {
            when(projectRepository.findById(5L)).thenReturn(Optional.of(project));
            when(taskRepository.findByProject(project)).thenReturn(List.of(task));

            List<TaskResponse> results = taskService.getTasksByProject(5L);

            assertThat(results).hasSize(1);
            assertThat(results.get(0).getTitle()).isEqualTo("Fix login bug");
            assertThat(results.get(0).getPriority()).isEqualTo(TaskPriority.HIGH);
        }

        @Test
        @DisplayName("should return an empty list when the project has no tasks")
        void getTasksByProject_noTasks_returnsEmpty() {
            when(projectRepository.findById(5L)).thenReturn(Optional.of(project));
            when(taskRepository.findByProject(project)).thenReturn(List.of());

            assertThat(taskService.getTasksByProject(5L)).isEmpty();
        }

        @Test
        @DisplayName("should throw RuntimeException when the project is not found")
        void getTasksByProject_projectNotFound_throws() {
            when(projectRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.getTasksByProject(99L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Project not found");
        }

        @Test
        @DisplayName("should map assignee name and email into TaskResponse")
        void getTasksByProject_mapsAssigneeFields() {
            when(projectRepository.findById(5L)).thenReturn(Optional.of(project));
            when(taskRepository.findByProject(project)).thenReturn(List.of(task));

            TaskResponse response = taskService.getTasksByProject(5L).get(0);

            assertThat(response.getAssigneeName()).isEqualTo("Bob Dev");
            assertThat(response.getAssigneeEmail()).isEqualTo("bob@company.com");
        }

        @Test
        @DisplayName("should not set assignee fields when task has no assignee")
        void getTasksByProject_noAssignee_fieldsAreNull() {
            task.setAssignee(null);
            when(projectRepository.findById(5L)).thenReturn(Optional.of(project));
            when(taskRepository.findByProject(project)).thenReturn(List.of(task));

            TaskResponse response = taskService.getTasksByProject(5L).get(0);

            assertThat(response.getAssigneeName()).isNull();
            assertThat(response.getAssigneeEmail()).isNull();
        }
    }

    // ── createTask() ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("createTask()")
    class CreateTask {

        private TaskRequest buildRequest(String title, String description, String assigneeEmail) {
            TaskRequest req = new TaskRequest();
            req.setTitle(title);
            req.setDescription(description);
            req.setStatus(TaskStatus.TODO);
            req.setPriority(TaskPriority.MEDIUM);
            req.setProjectId(5L);
            req.setAssigneeEmail(assigneeEmail);
            return req;
        }

        @Test
        @DisplayName("should create and return a TaskResponse for valid input")
        void createTask_success() {
            TaskRequest req = buildRequest("New feature", null, null);
            when(projectRepository.findById(5L)).thenReturn(Optional.of(project));
            when(taskRepository.save(any(Task.class))).thenReturn(task);

            TaskResponse response = taskService.createTask(req);

            assertThat(response).isNotNull();
            verify(taskRepository).save(any(Task.class));
        }

        @Test
        @DisplayName("should assign an existing user when assigneeEmail is provided")
        void createTask_withAssignee_success() {
            TaskRequest req = buildRequest("Task with assignee", null, "bob@company.com");
            when(projectRepository.findById(5L)).thenReturn(Optional.of(project));
            when(userRepository.findByEmail("bob@company.com")).thenReturn(Optional.of(assignee));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
                Task t = inv.getArgument(0);
                t.setId(2L);
                return t;
            });

            taskService.createTask(req);

            verify(userRepository).findByEmail("bob@company.com");
        }

        @Test
        @DisplayName("should throw RuntimeException when project is not found")
        void createTask_projectNotFound_throws() {
            TaskRequest req = buildRequest("Task", null, null);
            when(projectRepository.findById(5L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.createTask(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Project not found");
        }

        @Test
        @DisplayName("should throw RuntimeException when assigneeEmail is not registered")
        void createTask_assigneeNotFound_throws() {
            TaskRequest req = buildRequest("Task", null, "unknown@x.com");
            when(projectRepository.findById(5L)).thenReturn(Optional.of(project));
            when(userRepository.findByEmail("unknown@x.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.createTask(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Assignee not found");
        }

        @Test
        @DisplayName("should throw RuntimeException when description is non-empty but shorter than 30 characters")
        void createTask_shortDescription_throws() {
            // NOTE: description validation happens BEFORE projectRepository is called
            TaskRequest req = buildRequest("Valid Title", "Too short", null);

            assertThatThrownBy(() -> taskService.createTask(req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("30 characters");
        }

        @Test
        @DisplayName("should allow creating a task with an empty description")
        void createTask_emptyDescription_success() {
            TaskRequest req = buildRequest("Valid Title", "", null);
            when(projectRepository.findById(5L)).thenReturn(Optional.of(project));
            when(taskRepository.save(any(Task.class))).thenReturn(task);

            assertThatCode(() -> taskService.createTask(req)).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("should allow creating a task with a null description")
        void createTask_nullDescription_success() {
            TaskRequest req = buildRequest("Valid Title", null, null);
            when(projectRepository.findById(5L)).thenReturn(Optional.of(project));
            when(taskRepository.save(any(Task.class))).thenReturn(task);

            assertThatCode(() -> taskService.createTask(req)).doesNotThrowAnyException();
        }
    }

    // ── updateTask() ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("updateTask()")
    class UpdateTask {

        private TaskRequest buildUpdateRequest(String title, String description, String assigneeEmail) {
            TaskRequest req = new TaskRequest();
            req.setTitle(title);
            req.setDescription(description);
            req.setStatus(TaskStatus.IN_PROGRESS);
            req.setPriority(TaskPriority.LOW);
            req.setAssigneeEmail(assigneeEmail);
            return req;
        }

        @Test
        @DisplayName("should update the task and return an updated TaskResponse")
        void updateTask_success() {
            TaskRequest req = buildUpdateRequest("Updated title", null, "bob@company.com");
            when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
            when(userRepository.findByEmail("bob@company.com")).thenReturn(Optional.of(assignee));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

            TaskResponse response = taskService.updateTask(1L, req);

            assertThat(response.getTitle()).isEqualTo("Updated title");
            assertThat(response.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
        }

        @Test
        @DisplayName("should clear the assignee when assigneeEmail is null in the update request")
        void updateTask_clearAssignee() {
            TaskRequest req = buildUpdateRequest("Updated", null, null);
            when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
                Task t = inv.getArgument(0);
                assertThat(t.getAssignee()).isNull();
                return t;
            });

            taskService.updateTask(1L, req);
        }

        @Test
        @DisplayName("should throw RuntimeException when task is not found")
        void updateTask_taskNotFound_throws() {
            TaskRequest req = buildUpdateRequest("Updated", null, null);
            when(taskRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.updateTask(99L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Task not found");
        }

        @Test
        @DisplayName("should throw RuntimeException when description update is too short")
        void updateTask_shortDescription_throws() {
            // Description validation happens BEFORE taskRepository.findById — no stub needed
            TaskRequest req = buildUpdateRequest("Valid", "Short", null);

            assertThatThrownBy(() -> taskService.updateTask(1L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("30 characters");
        }

        @Test
        @DisplayName("should throw RuntimeException when new assigneeEmail is not registered")
        void updateTask_assigneeNotFound_throws() {
            TaskRequest req = buildUpdateRequest("Valid", null, "ghost@x.com");
            when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
            when(userRepository.findByEmail("ghost@x.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.updateTask(1L, req))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Assignee not found");
        }
    }

    // ── deleteTask() ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("deleteTask()")
    class DeleteTask {

        @Test
        @DisplayName("should delete an existing task without errors")
        void deleteTask_success() {
            when(taskRepository.existsById(1L)).thenReturn(true);

            assertThatCode(() -> taskService.deleteTask(1L)).doesNotThrowAnyException();
            verify(taskRepository).deleteById(1L);
        }

        @Test
        @DisplayName("should throw RuntimeException when task to delete does not exist")
        void deleteTask_notFound_throws() {
            when(taskRepository.existsById(99L)).thenReturn(false);

            assertThatThrownBy(() -> taskService.deleteTask(99L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Task not found");

            verify(taskRepository, never()).deleteById(any());
        }
    }

    // ── updateTaskStatus() ────────────────────────────────────────────────

    @Nested
    @DisplayName("updateTaskStatus()")
    class UpdateTaskStatus {

        @Test
        @DisplayName("should update status to IN_PROGRESS and return updated task")
        void updateTaskStatus_toInProgress() {
            when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

            TaskResponse response = taskService.updateTaskStatus(1L, "IN_PROGRESS");

            assertThat(response.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
        }

        @Test
        @DisplayName("should update status to DONE and return updated task")
        void updateTaskStatus_toDone() {
            when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
            when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

            TaskResponse response = taskService.updateTaskStatus(1L, "DONE");

            assertThat(response.getStatus()).isEqualTo(TaskStatus.DONE);
        }

        @Test
        @DisplayName("should throw RuntimeException when task is not found")
        void updateTaskStatus_taskNotFound_throws() {
            when(taskRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.updateTaskStatus(99L, "DONE"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Task not found");
        }

        @Test
        @DisplayName("should throw IllegalArgumentException for an invalid status string")
        void updateTaskStatus_invalidStatus_throws() {
            when(taskRepository.findById(1L)).thenReturn(Optional.of(task));

            assertThatThrownBy(() -> taskService.updateTaskStatus(1L, "INVALID_STATUS"))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ── getTasksByAssignee() ──────────────────────────────────────────────

    @Nested
    @DisplayName("getTasksByAssignee()")
    class GetTasksByAssignee {

        @Test
        @DisplayName("should return tasks assigned to the given user email")
        void getTasksByAssignee_success() {
            when(userRepository.findByEmail("bob@company.com")).thenReturn(Optional.of(assignee));
            when(taskRepository.findByAssignee(assignee)).thenReturn(List.of(task));

            List<TaskResponse> results = taskService.getTasksByAssignee("bob@company.com");

            assertThat(results).hasSize(1);
            assertThat(results.get(0).getAssigneeEmail()).isEqualTo("bob@company.com");
        }

        @Test
        @DisplayName("should return an empty list when the user has no assigned tasks")
        void getTasksByAssignee_noTasks_returnsEmpty() {
            when(userRepository.findByEmail("bob@company.com")).thenReturn(Optional.of(assignee));
            when(taskRepository.findByAssignee(assignee)).thenReturn(List.of());

            assertThat(taskService.getTasksByAssignee("bob@company.com")).isEmpty();
        }

        @Test
        @DisplayName("should throw RuntimeException when user email is not found")
        void getTasksByAssignee_userNotFound_throws() {
            when(userRepository.findByEmail("ghost@x.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> taskService.getTasksByAssignee("ghost@x.com"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("User not found");
        }
    }
}
