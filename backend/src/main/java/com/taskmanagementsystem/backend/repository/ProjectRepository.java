package com.taskmanagementsystem.backend.repository;

import com.taskmanagementsystem.backend.entity.Project;
import com.taskmanagementsystem.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByUserId(Long userId);

    List<Project> findByUser(User user);

    List<Project> findByTasksAssignee(User assignee);

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN p.tasks t WHERE p.user.id = :userId OR t.assignee.id = :userId")
    List<Project> findAllProjectsForUser(@Param("userId") Long userId);
}