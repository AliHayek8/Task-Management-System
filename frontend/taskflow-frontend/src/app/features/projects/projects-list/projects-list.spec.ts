import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectsListComponent, Project } from './projects-list.component';
import { By } from '@angular/platform-browser';
import { ProjectFormComponent } from '../project-form/project-form.component';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('ProjectsListComponent', () => {
  let component: ProjectsListComponent;
  let fixture: ComponentFixture<ProjectsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsListComponent, CommonModule, FormsModule, ProjectFormComponent, ButtonsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render initial projects', () => {
    const cards = fixture.debugElement.queryAll(By.css('.project-card'));
    expect(cards.length).toBe(3);
    expect(cards[0].nativeElement.textContent).toContain('Website Redesign');
    expect(cards[1].nativeElement.textContent).toContain('Mobile App MVP');
    expect(cards[2].nativeElement.textContent).toContain('API Integration');
  });

  it('should open new project form', () => {
    component.openNewProjectForm();
    fixture.detectChanges();

    expect(component.newProjectMode()).toBe(true);
    expect(component.editingProject()!.id).toBe(0);

    const form = fixture.debugElement.query(By.directive(ProjectFormComponent));
    expect(form).toBeTruthy();
  });

  it('should edit an existing project', () => {
    const projectToEdit: Project = component.projects()[0];
    component.editProject(projectToEdit);
    fixture.detectChanges();

    expect(component.newProjectMode()).toBe(false);
    expect(component.editingProject()!.id).toBe(projectToEdit.id);
  });

  it('should save a new project', () => {
  component.openNewProjectForm();
  fixture.detectChanges();

  const editingProject = component.editingProject()!;
  editingProject.name = 'New Project';
  editingProject.description = 'New Description';
  component.saveProject();
  fixture.detectChanges();

  const projects = component.projects();
  expect(projects.length).toBe(4);
  expect(projects[3].name).toBe('New Project');
});

it('should update an existing project', () => {
  const projectToEdit: Project = component.projects()[0];
  component.editProject(projectToEdit);
  fixture.detectChanges();

  const editing = component.editingProject()!;
  editing.name = 'Updated Name';
  component.saveProject();
  fixture.detectChanges();

  expect(component.projects()[0].name).toBe('Updated Name');
});
  it('should cancel edit', () => {
    component.openNewProjectForm();
    fixture.detectChanges();

    component.cancelEdit();
    fixture.detectChanges();

    expect(component.editingProject()).toBeNull();
    expect(component.newProjectMode()).toBe(false);
  });

  it('should delete a project', () => {
    const projectToDelete: Project = component.projects()[0];
    component.deleteProject(projectToDelete);
    fixture.detectChanges();

    const projects = component.projects();
    expect(projects.find(p => p.id === projectToDelete.id)).toBeUndefined();
    expect(projects.length).toBe(2);
  });
});