import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Dashboard } from './dashboard.component';
import { ProjectService } from '../../core/services/project/project.service';
import { TaskService } from '../../core/services/task/task.service';

describe('Dashboard', () => {
  let projectServiceMock: any;
  let taskServiceMock: any;

  const mockUser = { id: 1, email: 'test@test.com' };

  const projectsMock = [
    { id: 1, name: 'Project 1', description: 'first project' },
    { id: 2, name: 'Project 2', description: 'second project' }
  ];

  const tasksMock = [
    {
      id: 1,
      status: 'DONE',
      assigneeEmail: 'test@test.com',
      projectId: 1
    },
    {
      id: 2,
      status: 'IN_PROGRESS',
      assigneeEmail: 'test@test.com',
      projectId: 1
    },
    {
      id: 3,
      status: 'TODO',
      assigneeEmail: 'test@test.com',
      projectId: 2
    },
    {
      id: 4,
      status: 'DONE',
      assigneeEmail: 'other@test.com',
      projectId: 2
    }
  ];

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

  it('should create component', () => {
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

  it('should load projects when user exists', () => {
    sessionStorage.setItem('user', JSON.stringify(mockUser));

    projectServiceMock.getProjectsByOwner.mockReturnValue(of(projectsMock));

    taskServiceMock.getTasksByProject
      .mockReturnValueOnce(of(tasksMock.filter(task => task.projectId === 1)))
      .mockReturnValueOnce(of(tasksMock.filter(task => task.projectId === 2)));

    const { component } = createComponent();

    component.ngOnInit();

    expect(projectServiceMock.getProjectsByOwner).toHaveBeenCalledWith(1);
  });

  it('should load correct number of projects', () => {
    sessionStorage.setItem('user', JSON.stringify(mockUser));

    projectServiceMock.getProjectsByOwner.mockReturnValue(of(projectsMock));

    taskServiceMock.getTasksByProject.mockReturnValue(of([]));

    const { component } = createComponent();

    component.ngOnInit();

    expect(component.projects().length).toBe(2);
  });

  it('should attach tasks to projects correctly', () => {
    sessionStorage.setItem('user', JSON.stringify(mockUser));

    projectServiceMock.getProjectsByOwner.mockReturnValue(of(projectsMock));

    taskServiceMock.getTasksByProject
      .mockReturnValueOnce(of(tasksMock.filter(task => task.projectId === 1)))
      .mockReturnValueOnce(of(tasksMock.filter(task => task.projectId === 2)));

    const { component } = createComponent();

    component.ngOnInit();

    const projects = component.projects();

    expect(projects[0].tasks.length).toBe(2);
    expect(projects[1].tasks.length).toBe(2);
  });

  it('should calculate correct task stats (DONE / IN_PROGRESS / TODO)', () => {
    sessionStorage.setItem('user', JSON.stringify(mockUser));

    projectServiceMock.getProjectsByOwner.mockReturnValue(of(projectsMock));

    taskServiceMock.getTasksByProject
      .mockReturnValueOnce(of(tasksMock.filter(task => task.projectId === 1)))
      .mockReturnValueOnce(of(tasksMock.filter(task => task.projectId === 2)));

    const { component } = createComponent();

    component.ngOnInit();

    const stats = component.stats();

    expect(stats[0].value).toBe(1);
    expect(stats[1].value).toBe(1);
    expect(stats[2].value).toBe(1);
  });

  it('should calculate project progress correctly', () => {
    sessionStorage.setItem('user', JSON.stringify(mockUser));

    projectServiceMock.getProjectsByOwner.mockReturnValue(of(projectsMock));

    taskServiceMock.getTasksByProject
      .mockReturnValueOnce(of(tasksMock.filter(task => task.projectId === 1)))
      .mockReturnValueOnce(of(tasksMock.filter(task => task.projectId === 2)));

    const { component } = createComponent();

    component.ngOnInit();

    const projects = component.projects();

    const project1Progress =
      (projects[0].tasksCompleted / projects[0].totalTasks) * 100;

    const project2Progress =
      (projects[1].tasksCompleted / projects[1].totalTasks) * 100;

    expect(Math.round(project1Progress)).toBe(50);
    expect(Math.round(project2Progress)).toBe(50);
  });
});
