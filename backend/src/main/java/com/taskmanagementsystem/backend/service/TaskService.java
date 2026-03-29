package com.taskmanagementsystem.backend.service;

import com.taskmanagementsystem.backend.dto.TaskRequest;
import com.taskmanagementsystem.backend.dto.TaskResponse;
import com.taskmanagementsystem.backend.entity.Project;
import com.taskmanagementsystem.backend.entity.Task;
import com.taskmanagementsystem.backend.entity.User;
import com.taskmanagementsystem.backend.repository.ProjectRepository;
import com.taskmanagementsystem.backend.repository.TaskRepository;
import com.taskmanagementsystem.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public List<TaskResponse> getTasksByProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        return taskRepository.findByProject(project)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TaskResponse createTask(TaskRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus())
                .priority(request.getPriority())
                .deadline(request.getDeadline())
                .project(project)
                .build();

        if (request.getAssigneeEmail() != null && !request.getAssigneeEmail().isEmpty()) {
            User assignee = userRepository.findByEmail(request.getAssigneeEmail())
                    .orElseThrow(() -> new RuntimeException("Assignee not found with email: " + request.getAssigneeEmail()));
            task.setAssignee(assignee);
        }

        Task saved = taskRepository.save(task);
        return mapToResponse(saved);
    }

    public TaskResponse updateTask(Long id, TaskRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus());
        task.setPriority(request.getPriority());
        task.setDeadline(request.getDeadline());

        if (request.getAssigneeEmail() != null && !request.getAssigneeEmail().isEmpty()) {
            User assignee = userRepository.findByEmail(request.getAssigneeEmail())
                    .orElseThrow(() -> new RuntimeException("Assignee not found with email: " + request.getAssigneeEmail()));
            task.setAssignee(assignee);
        } else {
            task.setAssignee(null);
        }

        Task saved = taskRepository.save(task);
        return mapToResponse(saved);
    }

    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new RuntimeException("Task not found");
        }
        taskRepository.deleteById(id);
    }

    public TaskResponse updateTaskStatus(Long id, String status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setStatus(com.taskmanagementsystem.backend.entity.TaskStatus.valueOf(status));
        Task saved = taskRepository.save(task);
        return mapToResponse(saved);
    }

    public List<TaskResponse> getTasksByAssignee(String email) {
        User assignee = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return taskRepository.findByAssignee(assignee)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private TaskResponse mapToResponse(Task task) {
        TaskResponse response = new TaskResponse();
        response.setId(task.getId());
        response.setTitle(task.getTitle());
        response.setDescription(task.getDescription());
        response.setStatus(task.getStatus());
        response.setPriority(task.getPriority());
        response.setDeadline(task.getDeadline());
        response.setProjectId(task.getProject().getId());

        if (task.getAssignee() != null) {
            response.setAssigneeName(task.getAssignee().getName());
            response.setAssigneeEmail(task.getAssignee().getEmail());
        }

        return response;
    }
}