package com.taskmanagementsystem.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data            
@NoArgsConstructor 
@AllArgsConstructor 
public class ProjectDTO {
    private String name;
    private String description;
    private Long userId;
}