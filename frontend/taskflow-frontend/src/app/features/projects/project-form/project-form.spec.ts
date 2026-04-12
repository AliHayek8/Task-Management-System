import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Project } from '../../../core/services/project/project.service';
import { ProjectFormComponent } from './project-form.component';

describe('ProjectFormComponent (Business Tests)', () => {
  let component: ProjectFormComponent;
  let fixture: ComponentFixture<ProjectFormComponent>;

  const projectSignal = signal<Project>({
    userId: 1,
    id: 1,
    name: '',
    description: '',
  });

  const isNewSignal = signal(true);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectFormComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectFormComponent);
    component = fixture.componentInstance;

    component.project = projectSignal as any;
    component.isNewProject = isNewSignal as any;

    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });


  it('should initialize form with empty values', () => {
    expect(component.form).toBeDefined();

    expect(component.form.value).toEqual({
      name: '',
      description: '',
    });
  });

  it('should require project name minLength 3', () => {
    const name = component.form.get('name');

    name?.setValue('');
    expect(name?.valid).toBe(false);

    name?.setValue('ab');
    expect(name?.valid).toBe(false);

    name?.setValue('abc');
    expect(name?.valid).toBe(true);
  });

  it('should validate description minLength 30', () => {
    const desc = component.form.get('description');

    desc?.setValue('short');
    expect(desc?.valid).toBe(false);

    desc?.setValue('a'.repeat(29));
    expect(desc?.valid).toBe(false);

    desc?.setValue('a'.repeat(30));
    expect(desc?.valid).toBe(true);
  });

  it('should emit save with valid project data', () => {
    const saveSpy = vi.spyOn(component.save, 'emit');

    component.form.setValue({
      name: 'Test Project',
      description: 'a'.repeat(30),
    });

    component.onSave();

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Project',
        description: 'a'.repeat(30),
      })
    );
  });

  it('should NOT emit save if form is invalid', () => {
    const saveSpy = vi.spyOn(component.save, 'emit');

    component.form.setValue({
      name: '',
      description: '',
    });

    component.onSave();

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should prevent double submit', () => {
    const saveSpy = vi.spyOn(component.save, 'emit');

    component.form.setValue({
      name: 'Project A',
      description: 'a'.repeat(30),
    });

    component.onSave();
    component.onSave();

    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('should emit cancel event', () => {
    const cancelSpy = vi.spyOn(component.cancel, 'emit');

    component.onCancel();

    expect(cancelSpy).toHaveBeenCalled();
  });

  it('should map project input into form values', () => {
    projectSignal.set({
      userId: 1,
      id: 1,
      name: 'Existing Project',
      description: 'a'.repeat(30),
    });

    fixture.detectChanges();

    component.ngOnInit?.();

    expect(component.form.get('name')?.value).toBe('Existing Project');
    expect(component.form.get('description')?.value).toBe('a'.repeat(30));
  });
});
