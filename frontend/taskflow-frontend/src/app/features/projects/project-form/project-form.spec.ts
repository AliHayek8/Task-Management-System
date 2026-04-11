import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectFormComponent } from './project-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { signal, InputSignal } from '@angular/core';
import { Project } from '../../../core/services/project/project.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ProjectFormComponent', () => {
  let component: ProjectFormComponent;
  let fixture: ComponentFixture<ProjectFormComponent>;

  const projectSignal = signal<Project>({
    userId: 0,
    id: 0,
    name: '',
    description: ''
  });

  const isNewSignal = signal(true);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectFormComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectFormComponent);
    component = fixture.componentInstance;

    component.project = projectSignal as unknown as InputSignal<Project>;
    component.isNewProject = isNewSignal as unknown as InputSignal<boolean>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form', () => {
    expect(component.form).toBeDefined();

    expect(component.form.value).toEqual({
      name: '',
      description: ''
    });
  });

  it('should emit save with project data', () => {
    const saveSpy = vi.spyOn(component.save, 'emit');

    component.form.setValue({
      name: 'Test Project',
      description: 'Test description here'
    });

    component.onSave();

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Project',
        description: 'Test description here'
      })
    );
  });

  it('should prevent double submit', () => {
    const saveSpy = vi.spyOn(component.save, 'emit');

    component.form.setValue({
      name: 'Test',
      description: 'Test description'
    });

    component.onSave();
    component.onSave();

    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('should emit cancel', () => {
    const cancelSpy = vi.spyOn(component.cancel, 'emit');

    component.onCancel();

    expect(cancelSpy).toHaveBeenCalled();
  });
});
