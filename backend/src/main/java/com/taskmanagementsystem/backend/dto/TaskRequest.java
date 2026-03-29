package com.taskmanagementsystem.backend.dto;

import com.taskmanagementsystem.backend.entity.TaskPriority;
import com.taskmanagementsystem.backend.entity.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TaskRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private TaskStatus status;

    private TaskPriority priority;

    private String assigneeEmail;

    private LocalDate deadline;

    private Long projectId;
}