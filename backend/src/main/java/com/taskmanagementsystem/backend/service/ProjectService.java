package com.taskmanagementsystem.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.taskmanagementsystem.backend.dto.ProjectDTO;
import com.taskmanagementsystem.backend.entity.Project;
import com.taskmanagementsystem.backend.entity.User;
import com.taskmanagementsystem.backend.repository.ProjectRepository;
import com.taskmanagementsystem.backend.repository.UserRepository;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository, UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    public Project createProject(String name, String description, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = new Project();
        project.setName(name);
        project.setDescription(description);
        project.setUser(user);

        return projectRepository.save(project);
    }

    public List<Project> getProjectsByUser(Long userId) {
        return projectRepository.findByUserId(userId);
    }
public Project updateProject(Long id, ProjectDTO projectDTO) {
    Project project = projectRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Project not found"));

    project.setName(projectDTO.getName());
    project.setDescription(projectDTO.getDescription());
    return projectRepository.save(project);
}

public void deleteProject(Long id) {
    Project project = projectRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Project not found"));
    projectRepository.delete(project);
}
}