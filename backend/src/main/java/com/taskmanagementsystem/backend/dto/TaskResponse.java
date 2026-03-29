package com.taskmanagementsystem.backend.dto;

import com.taskmanagementsystem.backend.entity.TaskPriority;
import com.taskmanagementsystem.backend.entity.TaskStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TaskResponse {

    private Long id;
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;

    private String assigneeName;
    private String assigneeEmail;

    private LocalDate deadline;
    private Long projectId;
}