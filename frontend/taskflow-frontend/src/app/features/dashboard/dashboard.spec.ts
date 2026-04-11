import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Dashboard } from './dashboard.component';
import { ProjectService } from '../../core/services/project/project.service';
import { TaskService } from '../../core/services/task/task.service';

describe('Dashboard', () => {
  let projectServiceMock: any;
  let taskServiceMock: any;

  beforeEach(async () => {
    projectServiceMock = {
      getProjectsByOwner: vi.fn(),
    };

    taskServiceMock = {
      getTasksByProject: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: ProjectService, useValue: projectServiceMock },
        { provide: TaskService, useValue: taskServiceMock },
      ],
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(Dashboard);

    const component = fixture.componentInstance as any;

    fixture.detectChanges();

    return { fixture, component };
  }

  it('should create', () => {
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  it('should NOT load projects if no user in sessionStorage', () => {
    vi.spyOn(sessionStorage, 'getItem').mockReturnValue(null);

    projectServiceMock.getProjectsByOwner.mockReturnValue(of([]));

    const { component } = createComponent();

    component.ngOnInit();

    expect(projectServiceMock.getProjectsByOwner).not.toHaveBeenCalled();
  });

  it('should call loadProjects when user exists', () => {
    sessionStorage.setItem(
      'user',
      JSON.stringify({ id: 1, email: 'test@test.com' })
    );

    projectServiceMock.getProjectsByOwner.mockReturnValue(
      of([{ id: 1 }, { id: 2 }])
    );

    taskServiceMock.getTasksByProject.mockReturnValue(
      of([
        {
          id: 10,
          status: 'DONE',
          assigneeEmail: 'test@test.com',
          projectId: 1,
        },
      ])
    );

    const { component } = createComponent();

    component.ngOnInit();

    expect(projectServiceMock.getProjectsByOwner).toHaveBeenCalled();
  });

  it('should update stats correctly using updateStatsFromTasks', () => {
    const fixture = TestBed.createComponent(Dashboard);
    const component = fixture.componentInstance as any;

    component.updateStatsFromTasks([
      { status: 'DONE' } as any,
      { status: 'TODO' } as any,
      { status: 'DONE' } as any,
    ]);

    const stats = component.stats();

    expect(stats[0].value).toBe(2);
    expect(stats[2].value).toBe(1);
  });
});
