package com.taskmanagementsystem.backend.repository;

import com.taskmanagementsystem.backend.entity.Project;
import com.taskmanagementsystem.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByUser(User user);

    List<Project> findByTasksAssignee(User assignee);
}