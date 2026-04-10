import { Component, input, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Project } from '../../../core/services/project/project.service';
import { DynamicFormComponent, FormField } from '../../shared-form/dynamic-form.component';


@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DynamicFormComponent],
  templateUrl: './project-form.html',
  styleUrls: ['./project-form.scss'],
})
export class ProjectFormComponent {


  project = input.required<Project>();
  isNewProject = input.required<boolean>();


  save = output<Project>();
  cancel = output<void>();


  form!: FormGroup;


  fields: FormField[] = [
    { name: 'name', label: 'Project Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
  ];


  constructor(private fb: FormBuilder) {}


  ngOnInit() {
    this.form = this.fb.group({
      name: [this.project().name || '', [Validators.required, Validators.minLength(3)]],
      description: [this.project().description || '', [Validators.minLength(30)]],
    });
  }


  private submitted = false;


  onSave() {


    if (this.submitted) return;
    this.submitted = true;


    const updatedProject: Project = {
      ...this.project(),
      name: this.form.value.name,
      description: this.form.value.description,
    };


    this.save.emit(updatedProject);


  }

  onCancel() {
    this.cancel.emit();
  }
}
