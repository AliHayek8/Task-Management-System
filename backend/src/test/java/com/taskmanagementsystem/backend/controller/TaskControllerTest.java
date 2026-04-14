package com.taskmanagementsystem.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskmanagementsystem.backend.dto.TaskRequest;
import com.taskmanagementsystem.backend.dto.TaskResponse;
import com.taskmanagementsystem.backend.entity.TaskPriority;
import com.taskmanagementsystem.backend.entity.TaskStatus;
import com.taskmanagementsystem.backend.security.JwtAuthFilter;
import com.taskmanagementsystem.backend.security.JwtUtil;
import com.taskmanagementsystem.backend.service.TaskService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TaskController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("TaskController")
class TaskControllerTest {

    @Autowired MockMvc      mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean TaskService        taskService;
    @MockBean JwtUtil            jwtUtil;
    @MockBean JwtAuthFilter      jwtAuthFilter;
    @MockBean UserDetailsService userDetailsService;

    private TaskResponse buildResponse(Long id, String title, TaskStatus status) {
        TaskResponse r = new TaskResponse();
        r.setId(id);
        r.setTitle(title);
        r.setStatus(status);
        r.setPriority(TaskPriority.MEDIUM);
        r.setProjectId(5L);
        return r;
    }

    private TaskRequest buildRequest(String title) {
        TaskRequest req = new TaskRequest();
        req.setTitle(title);
        req.setStatus(TaskStatus.TODO);
        req.setPriority(TaskPriority.MEDIUM);
        req.setProjectId(5L);
        return req;
    }


    @Nested
    @DisplayName("GET /api/projects/{projectId}/tasks")
    class GetTasksByProject {

        @Test
        @WithMockUser
        @DisplayName("should return 200 and list of tasks for an existing project")
        void getByProject_success() throws Exception {
            List<TaskResponse> tasks = List.of(
                    buildResponse(1L, "Design UI",     TaskStatus.TODO),
                    buildResponse(2L, "Implement API", TaskStatus.IN_PROGRESS)
            );
            when(taskService.getTasksByProject(5L)).thenReturn(tasks);

            mockMvc.perform(get("/api/projects/5/tasks"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].title").value("Design UI"))
                    .andExpect(jsonPath("$[1].status").value("IN_PROGRESS"));
        }

        @Test
        @WithMockUser
        @DisplayName("should return 200 and empty array when project has no tasks")
        void getByProject_emptyList() throws Exception {
            when(taskService.getTasksByProject(5L)).thenReturn(List.of());

            mockMvc.perform(get("/api/projects/5/tasks"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
        }

        @Test
        @WithMockUser
        @DisplayName("should return 400 when project is not found")
        void getByProject_notFound_returns400() throws Exception {
            when(taskService.getTasksByProject(99L))
                    .thenThrow(new RuntimeException("Project not found"));

            mockMvc.perform(get("/api/projects/99/tasks"))
                    .andExpect(status().isBadRequest());
        }
    }


    @Nested
    @DisplayName("POST /api/tasks")
    class CreateTask {

        @Test
        @WithMockUser
        @DisplayName("should return 200 and the created task on valid input")
        void createTask_success() throws Exception {
            TaskRequest req  = buildRequest("Fix Bug");
            TaskResponse res = buildResponse(10L, "Fix Bug", TaskStatus.TODO);
            when(taskService.createTask(any(TaskRequest.class))).thenReturn(res);

            mockMvc.perform(post("/api/tasks")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(10))
                    .andExpect(jsonPath("$.title").value("Fix Bug"));
        }

        @Test
        @WithMockUser
        @DisplayName("should return 400 when title is blank (bean validation)")
        void createTask_blankTitle_returns400() throws Exception {
            TaskRequest req = buildRequest("");

            mockMvc.perform(post("/api/tasks")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser
        @DisplayName("should return 400 when title is too short (< 3 chars)")
        void createTask_shortTitle_returns400() throws Exception {
            TaskRequest req = buildRequest("AB");

            mockMvc.perform(post("/api/tasks")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser
        @DisplayName("should return 400 when assignee email is not registered")
        void createTask_unknownAssignee_returns400() throws Exception {
            TaskRequest req = buildRequest("Fix Bug");
            req.setAssigneeEmail("ghost@x.com");

            when(taskService.createTask(any())).thenThrow(
                    new RuntimeException("Assignee not found with email: ghost@x.com"));

            mockMvc.perform(post("/api/tasks")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Assignee not found with email: ghost@x.com"));
        }

        @Test
        @WithMockUser
        @DisplayName("should return 400 when description is too short")
        void createTask_shortDescription_returns400() throws Exception {
            TaskRequest req = buildRequest("Fix Bug");
            req.setDescription("short");

            when(taskService.createTask(any())).thenThrow(
                    new RuntimeException("Description must be at least 30 characters"));

            mockMvc.perform(post("/api/tasks")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }
    }


    @Nested
    @DisplayName("PUT /api/tasks/{id}")
    class UpdateTask {

        @Test
        @WithMockUser
        @DisplayName("should return 200 and updated task on success")
        void updateTask_success() throws Exception {
            TaskRequest req  = buildRequest("Updated title");
            TaskResponse res = buildResponse(1L, "Updated title", TaskStatus.IN_PROGRESS);
            when(taskService.updateTask(eq(1L), any(TaskRequest.class))).thenReturn(res);

            mockMvc.perform(put("/api/tasks/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.title").value("Updated title"))
                    .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
        }

        @Test
        @WithMockUser
        @DisplayName("should return 400 when task to update is not found")
        void updateTask_notFound_returns400() throws Exception {
            TaskRequest req = buildRequest("Updated title");
            when(taskService.updateTask(eq(99L), any())).thenThrow(new RuntimeException("Task not found"));

            mockMvc.perform(put("/api/tasks/99")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest());
        }
    }


    @Nested
    @DisplayName("DELETE /api/tasks/{id}")
    class DeleteTask {

        @Test
        @WithMockUser
        @DisplayName("should return 204 No Content on successful delete")
        void deleteTask_success() throws Exception {
            doNothing().when(taskService).deleteTask(1L);

            mockMvc.perform(delete("/api/tasks/1"))
                    .andExpect(status().isNoContent());
        }

        @Test
        @WithMockUser
        @DisplayName("should return 400 when task to delete is not found")
        void deleteTask_notFound_returns400() throws Exception {
            doThrow(new RuntimeException("Task not found")).when(taskService).deleteTask(99L);

            mockMvc.perform(delete("/api/tasks/99"))
                    .andExpect(status().isBadRequest());
        }
    }


    @Nested
    @DisplayName("PATCH /api/tasks/{id}/status")
    class UpdateTaskStatus {

        @Test
        @WithMockUser
        @DisplayName("should return 200 and updated task when status is valid")
        void updateStatus_success() throws Exception {
            TaskResponse res = buildResponse(1L, "Fix Bug", TaskStatus.IN_PROGRESS);
            when(taskService.updateTaskStatus(1L, "IN_PROGRESS")).thenReturn(res);

            mockMvc.perform(patch("/api/tasks/1/status").param("status", "IN_PROGRESS"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
        }

        @Test
        @WithMockUser
        @DisplayName("should return 400 when task is not found")
        void updateStatus_taskNotFound_returns400() throws Exception {
            when(taskService.updateTaskStatus(99L, "DONE"))
                    .thenThrow(new RuntimeException("Task not found"));

            mockMvc.perform(patch("/api/tasks/99/status").param("status", "DONE"))
                    .andExpect(status().isBadRequest());
        }
    }


    @Nested
    @DisplayName("GET /api/tasks/assignee")
    class GetTasksByAssignee {

        @Test
        @WithMockUser
        @DisplayName("should return 200 and tasks assigned to the given email")
        void getByAssignee_success() throws Exception {
            List<TaskResponse> tasks = List.of(buildResponse(1L, "Fix Bug", TaskStatus.TODO));
            when(taskService.getTasksByAssignee("dev@co.com")).thenReturn(tasks);

            mockMvc.perform(get("/api/tasks/assignee").param("email", "dev@co.com"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1));
        }

        @Test
        @WithMockUser
        @DisplayName("should return 400 when user email is not found")
        void getByAssignee_userNotFound_returns400() throws Exception {
            when(taskService.getTasksByAssignee("ghost@x.com"))
                    .thenThrow(new RuntimeException("User not found"));

            mockMvc.perform(get("/api/tasks/assignee").param("email", "ghost@x.com"))
                    .andExpect(status().isBadRequest());
        }
    }
}
