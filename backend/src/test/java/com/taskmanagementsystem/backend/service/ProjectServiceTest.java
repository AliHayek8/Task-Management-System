package com.taskmanagementsystem.backend.service;

import com.taskmanagementsystem.backend.dto.ProjectDTO;
import com.taskmanagementsystem.backend.entity.Project;
import com.taskmanagementsystem.backend.entity.User;
import com.taskmanagementsystem.backend.repository.ProjectRepository;
import com.taskmanagementsystem.backend.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProjectService")
class ProjectServiceTest {

    @Mock ProjectRepository projectRepository;
    @Mock UserRepository    userRepository;

    @InjectMocks ProjectService projectService;

    private User    owner;
    private Project project;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L).name("Alice").email("alice@example.com").password("hash").build();

        project = new Project();
        project.setId(10L);
        project.setName("TaskFlow");
        project.setDescription("Project management tool");
        project.setUser(owner);
    }


    @Nested
    @DisplayName("createProject()")
    class CreateProject {

        @Test
        @DisplayName("should create and return a project for an existing user")
        void createProject_success() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
            when(projectRepository.save(any(Project.class))).thenReturn(project);

            Project result = projectService.createProject("TaskFlow", "Project management tool", 1L);

            assertThat(result.getName()).isEqualTo("TaskFlow");
            assertThat(result.getDescription()).isEqualTo("Project management tool");
            verify(projectRepository).save(any(Project.class));
        }

        @Test
        @DisplayName("should associate the project with the correct user")
        void createProject_userIsLinked() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
            when(projectRepository.save(any(Project.class))).thenAnswer(inv -> {
                Project p = inv.getArgument(0);
                assertThat(p.getUser()).isEqualTo(owner);
                return project;
            });

            projectService.createProject("TaskFlow", "desc", 1L);
        }

        @Test
        @DisplayName("should throw RuntimeException when user is not found")
        void createProject_userNotFound_throws() {
            when(userRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> projectService.createProject("X", "Y", 99L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("User not found");

            verify(projectRepository, never()).save(any());
        }

        @Test
        @DisplayName("should allow creating a project with a null description")
        void createProject_nullDescription_success() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
            when(projectRepository.save(any(Project.class))).thenReturn(project);

            assertThatCode(() -> projectService.createProject("TaskFlow", null, 1L))
                    .doesNotThrowAnyException();
        }
    }


    @Nested
    @DisplayName("getProjectsByUser()")
    class GetProjectsByUser {

        @Test
        @DisplayName("should return all projects for a user (owned + assigned)")
        void getProjectsByUser_success() {
            when(projectRepository.findAllProjectsForUser(1L)).thenReturn(List.of(project));

            List<Project> results = projectService.getProjectsByUser(1L);

            assertThat(results).hasSize(1);
            assertThat(results.get(0).getName()).isEqualTo("TaskFlow");
        }

        @Test
        @DisplayName("should return an empty list when the user has no projects")
        void getProjectsByUser_empty() {
            when(projectRepository.findAllProjectsForUser(1L)).thenReturn(List.of());

            assertThat(projectService.getProjectsByUser(1L)).isEmpty();
        }

        @Test
        @DisplayName("should delegate to the correct repository query method")
        void getProjectsByUser_callsCorrectMethod() {
            when(projectRepository.findAllProjectsForUser(1L)).thenReturn(List.of());

            projectService.getProjectsByUser(1L);

            verify(projectRepository).findAllProjectsForUser(1L);
        }
    }


    @Nested
    @DisplayName("updateProject()")
    class UpdateProject {

        @Test
        @DisplayName("should update name and description and return the updated project")
        void updateProject_success() {
            ProjectDTO dto = new ProjectDTO();
            dto.setName("Updated Name");
            dto.setDescription("Updated desc");

            when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
            when(projectRepository.save(any(Project.class))).thenAnswer(inv -> inv.getArgument(0));

            Project result = projectService.updateProject(10L, dto);

            assertThat(result.getName()).isEqualTo("Updated Name");
            assertThat(result.getDescription()).isEqualTo("Updated desc");
        }

        @Test
        @DisplayName("should save the project after update")
        void updateProject_saveIsCalled() {
            ProjectDTO dto = new ProjectDTO();
            dto.setName("X");
            dto.setDescription("Y");
            when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
            when(projectRepository.save(any(Project.class))).thenReturn(project);

            projectService.updateProject(10L, dto);

            verify(projectRepository).save(project);
        }

        @Test
        @DisplayName("should throw RuntimeException when project to update is not found")
        void updateProject_notFound_throws() {
            ProjectDTO dto = new ProjectDTO();
            dto.setName("X");
            when(projectRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> projectService.updateProject(99L, dto))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Project not found");
        }
    }


    @Nested
    @DisplayName("deleteProject()")
    class DeleteProject {

        @Test
        @DisplayName("should delete an existing project without throwing")
        void deleteProject_success() {
            when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

            assertThatCode(() -> projectService.deleteProject(10L)).doesNotThrowAnyException();
            verify(projectRepository).delete(project);
        }

        @Test
        @DisplayName("should throw RuntimeException when project to delete is not found")
        void deleteProject_notFound_throws() {
            when(projectRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> projectService.deleteProject(99L))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessage("Project not found");

            verify(projectRepository, never()).delete(any());
        }
    }
}
