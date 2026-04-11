import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { UserService } from '../../core/services/user/user.service';

describe('ProfileComponent', () => {
  let userServiceMock: any;

  beforeEach(async () => {
    sessionStorage.clear();

    // 👇 default sessionStorage values
    sessionStorage.setItem(
      'user',
      JSON.stringify({ name: 'John', email: 'john@test.com' })
    );

    sessionStorage.setItem('token', 'fake-token');

    userServiceMock = {
      // API overrides sessionStorage (so expected = Ali)
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

    fixture.detectChanges(); // triggers ngOnInit

    return { fixture, component };
  }

  it('should create component', () => {
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  it('should initialize user from sessionStorage then override with API', () => {
    const { component } = createComponent();

    // sessionStorage = John, but API overrides → Ali
    expect(component.user.name).toBe('Ali');
    expect(component.user.email).toBe('ali@test.com');
  });

  it('should call getProfile when token exists', () => {
    createComponent();

    expect(userServiceMock.getProfile).toHaveBeenCalledWith('fake-token');
  });

  it('should patch form when user fetched', () => {
    const { component } = createComponent();

    expect(component.form.value.name).toBe('Ali');
  });

  it('should call updateName on save', () => {
    const { component } = createComponent();

    component.form.setValue({ name: 'New Name' });

    component.saveGeneral();

    expect(userServiceMock.updateName).toHaveBeenCalledWith(
      'fake-token',
      'New Name'
    );
  });
});
