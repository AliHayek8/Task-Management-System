import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectFormComponent } from './project-form.component';
import { FormsModule } from '@angular/forms';
import { signal, InputSignal } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Project } from '../projects-list/projects-list.component';

describe('ProjectFormComponent', () => {
  let component: ProjectFormComponent;
  let fixture: ComponentFixture<ProjectFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectFormComponent, FormsModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectFormComponent);
    component = fixture.componentInstance;

   component.project = signal<Project>({
     userId: 0,
     id: 0,
  name: '',
  description: '',
  tasksCompleted: 0,
  totalTasks: 0
}) as unknown as InputSignal<Project>;

component.isNewProject = signal(true) as unknown as InputSignal<boolean>;


    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should show "New Project" title when project.id is 0', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h3')?.textContent).toBe('New Project');
  });

  it('should update project values when input changes', async () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const nameInput = compiled.querySelector('input') as HTMLInputElement;
    const descTextarea = compiled.querySelector('textarea') as HTMLTextAreaElement;

    nameInput.value = 'Test Name';
    nameInput.dispatchEvent(new Event('input'));

    descTextarea.value = 'Test Description';
    descTextarea.dispatchEvent(new Event('input'));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.project().name).toBe('Test Name');
    expect(component.project().description).toBe('Test Description');
  });



  it('should call closeForm without errors onCancel', () => {
    expect(() => component.onCancel()).not.toThrow();
  });
});
