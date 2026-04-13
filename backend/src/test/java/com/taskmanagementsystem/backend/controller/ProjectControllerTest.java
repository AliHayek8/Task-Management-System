package com.taskmanagementsystem.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskmanagementsystem.backend.dto.ProjectDTO;
import com.taskmanagementsystem.backend.entity.Project;
import com.taskmanagementsystem.backend.entity.User;
import com.taskmanagementsystem.backend.security.JwtAuthFilter;
import com.taskmanagementsystem.backend.security.JwtUtil;
import com.taskmanagementsystem.backend.service.ProjectService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProjectController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("ProjectController")
class ProjectControllerTest {

    @Autowired MockMvc      mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean ProjectService     projectService;
    @MockBean JwtUtil            jwtUtil;
    @MockBean JwtAuthFilter      jwtAuthFilter;
    @MockBean UserDetailsService userDetailsService;

    private User    owner;
    private Project project;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L).name("Alice").email("alice@example.com").password("hash").build();

        project = new Project();
        project.setId(10L);
        project.setName("TaskFlow");
        project.setDescription("Project management app");
        project.setUser(owner);
    }

    // ── POST /api/projects ────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /api/projects")
    class CreateProject {

        @Test
        @WithMockUser
        @DisplayName("should return 200 and the created project on valid input")
        void create_success() throws Exception {
            ProjectDTO dto = new ProjectDTO();
            dto.setName("TaskFlow");
            dto.setDescription("Project management app");
            dto.setUserId(1L);

            when(projectService.createProject("TaskFlow", "Project management app", 1L))
                    .thenReturn(project);

            mockMvc.perform(post("/api/projects")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(10))
                    .andExpect(jsonPath("$.name").value("TaskFlow"));
        }

        @Test
        @WithMockUser
        @DisplayName("should return 400 when the user is not found")
        void create_userNotFound_returns400() throws Exception {
            ProjectDTO dto = new ProjectDTO();
            dto.setName("X");
            dto.setUserId(99L);

            when(projectService.createProject(any(), any(), eq(99L)))
                    .thenThrow(new RuntimeException("User not found"));

            mockMvc.perform(post("/api/projects")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("User not found"));
        }
    }

    // ── GET /api/projects/user/{userId} ───────────────────────────────────

    @Nested
    @DisplayName("GET /api/projects/user/{userId}")
    class GetProjectsByUser {

        @Test
        @WithMockUser
        @DisplayName("should return 200 and a list of projects for the given user")
        void getByUser_success() throws Exception {
            when(projectService.getProjectsByUser(1L)).thenReturn(List.of(project));

            mockMvc.perform(get("/api/projects/user/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].name").value("TaskFlow"));
        }

        @Test
        @WithMockUser
        @DisplayName("should return 200 and an empty list when user has no projects")
        void getByUser_empty() throws Exception {
            when(projectService.getProjectsByUser(1L)).thenReturn(List.of());

            mockMvc.perform(get("/api/projects/user/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
        }
    }

    // ── PUT /api/projects/{id} ────────────────────────────────────────────

    @Nested
    @DisplayName("PUT /api/projects/{id}")
    class UpdateProject {

        @Test
        @WithMockUser
        @DisplayName("should return 200 and the updated project")
        void update_success() throws Exception {
            ProjectDTO dto = new ProjectDTO();
            dto.setName("Updated Name");
            dto.setDescription("Updated desc");

            Project updated = new Project();
            updated.setId(10L);
            updated.setName("Updated Name");
            updated.setDescription("Updated desc");
            updated.setUser(owner);

            when(projectService.updateProject(eq(10L), any(ProjectDTO.class))).thenReturn(updated);

            mockMvc.perform(put("/api/projects/10")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Updated Name"))
                    .andExpect(jsonPath("$.description").value("Updated desc"));
        }

        @Test
        @WithMockUser
        @DisplayName("should return 400 when project to update is not found")
        void update_notFound_returns400() throws Exception {
            ProjectDTO dto = new ProjectDTO();
            dto.setName("X");
            when(projectService.updateProject(eq(99L), any()))
                    .thenThrow(new RuntimeException("Project not found"));

            mockMvc.perform(put("/api/projects/99")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest());
        }
    }

    // ── DELETE /api/projects/{id} ─────────────────────────────────────────

    @Nested
    @DisplayName("DELETE /api/projects/{id}")
    class DeleteProject {

        @Test
        @WithMockUser
        @DisplayName("should return 204 No Content on successful delete")
        void delete_success() throws Exception {
            doNothing().when(projectService).deleteProject(10L);

            mockMvc.perform(delete("/api/projects/10"))
                    .andExpect(status().isNoContent());
        }

        @Test
        @WithMockUser
        @DisplayName("should return 400 when project to delete is not found")
        void delete_notFound_returns400() throws Exception {
            doThrow(new RuntimeException("Project not found"))
                    .when(projectService).deleteProject(99L);

            mockMvc.perform(delete("/api/projects/99"))
                    .andExpect(status().isBadRequest());
        }
    }
}
