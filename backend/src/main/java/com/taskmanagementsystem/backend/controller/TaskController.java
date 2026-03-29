package com.taskmanagementsystem.backend.controller;

import com.taskmanagementsystem.backend.dto.TaskRequest;
import com.taskmanagementsystem.backend.dto.TaskResponse;
import com.taskmanagementsystem.backend.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController

@RequestMapping("/api")

@CrossOrigin(origins = "*")

@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;


    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskResponse>> getTasksByProject(
            @PathVariable Long projectId) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId));
    }

    @PostMapping("/tasks")
    public ResponseEntity<TaskResponse> createTask(
            @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskService.createTask(request));
    }

    @PutMapping("/tasks/{id}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskService.updateTask(id, request));
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }


    @PatchMapping("/tasks/{id}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(taskService.updateTaskStatus(id, status));
    }


    @GetMapping("/tasks/assignee")
    public ResponseEntity<List<TaskResponse>> getTasksByAssignee(
            @RequestParam String email) {
        return ResponseEntity.ok(taskService.getTasksByAssignee(email));
    }
}