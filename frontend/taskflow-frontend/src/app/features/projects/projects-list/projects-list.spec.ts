import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectsListComponent } from '../projects-list/projects-list.component';
import { ProjectService } from '../../../core/services/project/project.service';
import { TaskService } from '../../../core/services/task/task.service';



describe('ProjectsListComponent', () => {
  let component: ProjectsListComponent;
  let fixture: ComponentFixture<ProjectsListComponent>;

  const projectServiceMock = {
    getProjectsByOwner: vi.fn(() =>
      of([
        { id: 1, name: 'Project Alpha', description: 'First project', userId: 1 },
        { id: 2, name: 'Project Beta', description: 'Second project', userId: 1 },
      ])
    ),
    createProject: vi.fn((p: any) => of({ ...p, id: 99 })),
    updateProject: vi.fn((id: number, p: any) => of({ ...p, id })),
    deleteProject: vi.fn(() => of({})),
  };

  const taskServiceMock = {
    getTasksByProject: vi.fn((projectId: number) => {
      if (projectId === 1) {
        return of([
          { status: 'DONE' },
          { status: 'DONE' },
          { status: 'TODO' },
        ]);
      }

      return of([
        { status: 'DONE' },
        { status: 'TODO' },
      ]);
    }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsListComponent],
      providers: [
        { provide: ProjectService, useValue: projectServiceMock },
        { provide: TaskService, useValue: taskServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsListComponent);
    component = fixture.componentInstance;
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should open add project popup', () => {
    component.openAddProject();

    expect(component.showPopup()).toBe(true);
    expect(component.currentProject().id).toBe(0);
  });

  it('should open edit project popup', () => {
    component.openEditProject({
      id: 10,
      name: 'Test Project',
      description: 'desc',
      userId: 1,
    } as any);

    expect(component.showPopup()).toBe(true);
    expect(component.currentProject().id).toBe(10);
  });


  it('should load projects and attach task stats', () => {
    vi.spyOn(component as any, 'getUserId').mockReturnValue(1);

    component.ngOnInit();

    expect(projectServiceMock.getProjectsByOwner).toHaveBeenCalledWith(1);

    const projects = component.projects();

    expect(projects.length).toBe(2);

    const p1 = projects.find(p => p.id === 1);
    expect(p1?.totalTasks).toBe(3);
    expect(p1?.tasksCompleted).toBe(2);

    const p2 = projects.find(p => p.id === 2);
    expect(p2?.totalTasks).toBe(2);
    expect(p2?.tasksCompleted).toBe(1);
  });

  it('should create project', () => {
    vi.spyOn(component as any, 'getUserId').mockReturnValue(1);

    component.saveProject({
      id: 0,
      name: 'New Project',
      description: 'desc',
      userId: 0,
    } as any);

    expect(projectServiceMock.createProject).toHaveBeenCalled();
  });

  it('should update project', async () => {
    vi.spyOn(component as any, 'getUserId').mockReturnValue(1);

    component.saveProject({
      id: 5,
      name: 'Updated Project',
      description: 'desc',
      userId: 1,
    } as any);

    await fixture.whenStable();

    expect(projectServiceMock.updateProject).toHaveBeenCalledWith(
      5,
      expect.any(Object)
    );
  });

  it('should delete project when confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.deleteProject(1);

    expect(projectServiceMock.deleteProject).toHaveBeenCalledWith(1);
  });

  it('should filter projects by search query', () => {
    vi.spyOn(component as any, 'getUserId').mockReturnValue(1);

    component.ngOnInit();

    component.onSearch('Alpha');

    const result = component.filteredProjects();

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Project Alpha');
  });

  it('should filter projects that have tasks', () => {
    vi.spyOn(component as any, 'getUserId').mockReturnValue(1);

    component.ngOnInit();

    component.onFilterChange('HAS_TASKS');

    const result = component.filteredProjects();

    expect(result.length).toBe(2);
  });


  it('should filter completed projects only', () => {
    vi.spyOn(component as any, 'getUserId').mockReturnValue(1);

    taskServiceMock.getTasksByProject.mockImplementation((id: number) => {
      if (id === 1) {
        return of([
          { status: 'DONE' },
          { status: 'DONE' },
        ]);
      }

      return of([
        { status: 'DONE' },
        { status: 'TODO' },
      ]);
    });

    component.ngOnInit();

    component.onFilterChange('COMPLETED');

    const result = component.filteredProjects();

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });

  it('should return empty result when search does not match', () => {
    vi.spyOn(component as any, 'getUserId').mockReturnValue(1);

    component.ngOnInit();

    component.onSearch('NOT_EXISTING_PROJECT');

    expect(component.filteredProjects().length).toBe(0);
  });
});
