import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { UserService } from '../../core/services/user/user.service';

describe('ProfileComponent', () => {
  let userServiceMock: any;

  beforeEach(async () => {
    sessionStorage.clear();

    sessionStorage.setItem(
      'user',
      JSON.stringify({ name: 'John', email: 'john@test.com' })
    );

    sessionStorage.setItem('token', 'fake-token');

    userServiceMock = {
      getProfile: vi.fn().mockReturnValue(
        of({ name: 'Ali', email: 'ali@test.com' })
      ),

      updateName: vi.fn().mockReturnValue(
        of({ name: 'New Name', email: 'ali@test.com' })
      ),

      setCurrentUser: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: userServiceMock },
      ],
    }).compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance as any;

    fixture.detectChanges();

    return { fixture, component };
  }

  it('should create component', () => {
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  it('should load user from API and override sessionStorage', () => {
    const { component } = createComponent();

    expect(component.user.name).toBe('Ali');
    expect(component.user.email).toBe('ali@test.com');
  });

  it('should call getProfile with token', () => {
    createComponent();

    expect(userServiceMock.getProfile).toHaveBeenCalledWith('fake-token');
  });

  it('should patch form with fetched user name', () => {
    const { component } = createComponent();

    expect(component.form.value.name).toBe('Ali');
  });

  it('should set current user after fetch', () => {
    createComponent();

    expect(userServiceMock.setCurrentUser).toHaveBeenCalledWith({
      name: 'Ali',
      email: 'ali@test.com',
    });
  });

  it('should call updateName when saving valid form', () => {
    const { component } = createComponent();

    component.form.setValue({ name: 'Updated Name' });

    component.saveGeneral();

    expect(userServiceMock.updateName).toHaveBeenCalledWith(
      'fake-token',
      'Updated Name'
    );
  });

  it('should update user after successful save', () => {
    const { component } = createComponent();

    component.form.setValue({ name: 'New Name' });
    component.saveGeneral();

    expect(component.user.name).toBe('New Name');
  });

  it('should NOT save if form is invalid', () => {
    const { component } = createComponent();

    component.form.setValue({ name: '' });
    component.saveGeneral();

    expect(userServiceMock.updateName).not.toHaveBeenCalled();
  });

  it('should reset form on cancel', () => {
    const { component } = createComponent();

    component.form.setValue({ name: 'Changed Name' });

    component.cancelEdit();

    expect(component.form.value.name).toBe('Ali');
  });

  it('should prevent save when already saving', () => {
    const { component } = createComponent();

    component.isSaving = true;

    component.saveGeneral();

    expect(userServiceMock.updateName).not.toHaveBeenCalled();
  });
});
