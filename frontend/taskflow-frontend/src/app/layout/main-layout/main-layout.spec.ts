import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainLayoutComponent } from './main-layout.component';
import { RouterTestingModule } from '@angular/router/testing'; 
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MainLayoutComponent,
        RouterTestingModule 
      ],
      schemas: [NO_ERRORS_SCHEMA] 
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); 
    await fixture.whenStable();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have 3 navigation items', () => {
    expect(component.items.length).toBe(3);
    expect(component.items.map(i => i.text)).toEqual(['Dashboard', 'Projects', 'Profile']);
  });

  it('should render nav links in template', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('.nav-item');
    expect(navLinks.length).toBe(3);
    expect(navLinks[0].textContent?.trim()).toBe('Dashboard');
    expect(navLinks[1].textContent?.trim()).toBe('Projects');
    expect(navLinks[2].textContent?.trim()).toBe('Profile');
  });
});