import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DynamicFormComponent } from '../shared-form/dynamic-form.component';

describe('DynamicFormComponent', () => {
  let component: DynamicFormComponent;
  let fixture: ComponentFixture<DynamicFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should NOT emit submit when form is invalid', () => {
    const form = new FormGroup({
      name: new FormControl('', Validators.required),
    });

    const submitSpy = vi.spyOn(component.submit, 'emit');

    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('fields', [
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
      },
    ]);

    component.onSubmit();

    expect(submitSpy).not.toHaveBeenCalled();
    expect(form.touched).toBe(true);
  });

  it('should emit submit when form is valid', () => {
    const form = new FormGroup({
      name: new FormControl('John', Validators.required),
    });

    const submitSpy = vi.spyOn(component.submit, 'emit');

    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('fields', [
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
      },
    ]);

    component.onSubmit();

    expect(submitSpy).toHaveBeenCalled();
  });

  it('should emit cancel event', () => {
    const cancelSpy = vi.spyOn(component.cancel, 'emit');

    component.cancel.emit();

    expect(cancelSpy).toHaveBeenCalled();
  });

  it('should detect required field correctly', () => {
    const form = new FormGroup({
      email: new FormControl(''),
    });

    fixture.componentRef.setInput('form', form);

    const field = {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
    } as any;

    expect(component.isFieldRequired(field)).toBe(true);
  });

  it('should evaluate requiredIf function', () => {
    const form = new FormGroup({
      password: new FormControl(''),
    });

    fixture.componentRef.setInput('form', form);

    const field = {
      name: 'password',
      label: 'Password',
      type: 'password',
      requiredIf: (f: FormGroup) => {
        return true;
      },
    } as any;

    expect(component.isFieldRequired(field)).toBe(true);
  });

  it('should mark form as touched when invalid submit', () => {
    const form = new FormGroup({
      name: new FormControl('', Validators.required),
    });

    fixture.componentRef.setInput('form', form);

    component.onSubmit();

    expect(form.touched).toBe(true);
  });
});
