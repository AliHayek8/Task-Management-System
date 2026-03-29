package com.taskmanagementsystem.backend.repository;

import com.taskmanagementsystem.backend.entity.Task;
import com.taskmanagementsystem.backend.entity.User;
import com.taskmanagementsystem.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByProject(Project project);

    List<Task> findByAssignee(User assignee);
}