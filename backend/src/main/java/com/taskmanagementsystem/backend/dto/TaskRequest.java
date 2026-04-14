package com.taskmanagementsystem.backend.dto;

import com.taskmanagementsystem.backend.entity.TaskPriority;
import com.taskmanagementsystem.backend.entity.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TaskRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, message = "Title must be at least 3 characters")
    private String title;

    private String description;

    private TaskStatus status;
    private TaskPriority priority;
    private String assigneeEmail;
    private LocalDate deadline;
    private Long projectId;
}