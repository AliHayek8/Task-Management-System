import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectsListComponent } from '../projects-list/projects-list.component';
import { ProjectService } from '../../../core/services/project/project.service';
import { TaskService } from '../../../core/services/task/task.service';
import { PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ProjectsListComponent', () => {
  let component: ProjectsListComponent;
  let fixture: ComponentFixture<ProjectsListComponent>;

  const projectServiceMock = {
    getProjectsByOwner: vi.fn(() =>
      of([
        { id: 1, name: 'Proj 1', description: 'desc', userId: 1 },
        { id: 2, name: 'Proj 2', description: 'desc', userId: 1 },
      ])
    ),
    createProject: vi.fn((p: any) => of({ ...p, id: 99 })),
    updateProject: vi.fn((id: number, p: any) => of(p)),
    deleteProject: vi.fn(() => of({})),
  };

  const taskServiceMock = {
    getTasksByProject: vi.fn(() =>
      of([
        { status: 'DONE' },
        { status: 'TODO' },
        { status: 'DONE' },
      ])
    ),
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

  it('should create', () => {
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
      name: 'Test',
      description: 'desc',
      userId: 1,
    } as any);

    expect(component.showPopup()).toBe(true);
    expect(component.currentProject().id).toBe(10);
  });

  it('should load projects on init', () => {
    vi.spyOn(component as any, 'getUserId').mockReturnValue(1);
    component.ngOnInit();

    expect(projectServiceMock.getProjectsByOwner).toHaveBeenCalledWith(1);
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

    projectServiceMock.updateProject.mockReturnValue(of({
      id: 5,
      name: 'Updated',
      description: 'desc',
      userId: 1
    }));

    component.saveProject({
      id: 5,
      name: 'Updated',
      description: 'desc',
      userId: 1
    });

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


});
