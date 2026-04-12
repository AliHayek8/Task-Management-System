import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProjectService, Project } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  const apiUrl = 'http://localhost:8080/api/projects';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProjectService],
    });

    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);

    sessionStorage.setItem('token', 'fake-token');
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('should fetch projects by owner', () => {
    const mockProjects: Project[] = [
      { id: 1, name: 'P1', description: 'D1', userId: 1 },
    ];

    service.getProjectsByOwner(1).subscribe((projects) => {
      expect(projects.length).toBe(1);
      expect(projects).toEqual(mockProjects);
    });

    const req = httpMock.expectOne(`${apiUrl}/user/1`);

    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');

    req.flush(mockProjects);
  });

  it('should create a project', () => {
    const newProject: Project = {
      name: 'New Project',
      description: 'desc',
      userId: 1,
    };

    const response = { ...newProject, id: 99 };

    service.createProject(newProject).subscribe((project) => {
      expect(project.id).toBe(99);
      expect(project.name).toBe('New Project');
    });

    const req = httpMock.expectOne(apiUrl);

    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');

    req.flush(response);
  });

  it('should update a project', () => {
    const updatedProject: Project = {
      name: 'Updated',
      description: 'desc',
      userId: 1,
    };

    const response = { ...updatedProject, id: 5 };

    service.updateProject(5, updatedProject).subscribe((project) => {
      expect(project.id).toBe(5);
      expect(project.name).toBe('Updated');
    });

    const req = httpMock.expectOne(`${apiUrl}/5`);

    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatedProject);
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');

    req.flush(response);
  });

  it('should delete a project', () => {
    service.deleteProject(10).subscribe((res) => {
      expect(res).toBeNull();
    });

    const req = httpMock.expectOne(`${apiUrl}/10`);

    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');

    req.flush(null);
  });
});
