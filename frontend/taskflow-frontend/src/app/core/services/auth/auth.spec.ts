import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const API_URL = 'http://localhost:8080/api/auth';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service  = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());


  it('should be created', () => {
    expect(service).toBeTruthy();
  });


  describe('register()', () => {
    const registerPayload = { name: 'Alice Smith', email: 'alice@example.com', password: 'secret123' };
    const mockAuthResponse = { id: 1, token: 'jwt-token-abc', name: 'Alice Smith', email: 'alice@example.com' };

    it('should POST to /register and return an auth response', () => {
      service.register(registerPayload).subscribe((res) => {
        expect(res).toEqual(mockAuthResponse);
      });
      const req = httpMock.expectOne(`${API_URL}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerPayload);
      req.flush(mockAuthResponse);
    });

    it('should send the correct user data in the request body', () => {
      service.register(registerPayload).subscribe();
      const req = httpMock.expectOne(`${API_URL}/register`);
      expect(req.request.body.name).toBe('Alice Smith');
      expect(req.request.body.email).toBe('alice@example.com');
      expect(req.request.body.password).toBe('secret123');
      req.flush(mockAuthResponse);
    });

    it('should return a token inside the response', () => {
      service.register(registerPayload).subscribe((res: any) => {
        expect(res.token).toBe('jwt-token-abc');
      });
      const req = httpMock.expectOne(`${API_URL}/register`);
      req.flush(mockAuthResponse);
    });

    it('should propagate 400 error when email already exists', () => {
      let errorReceived: any;
      service.register(registerPayload).subscribe({ error: (err) => (errorReceived = err) });
      const req = httpMock.expectOne(`${API_URL}/register`);
      req.flush({ message: 'Email already exists' }, { status: 400, statusText: 'Bad Request' });
      expect(errorReceived.status).toBe(400);
    });

    it('should propagate 500 server error', () => {
      let errorReceived: any;
      service.register(registerPayload).subscribe({ error: (err) => (errorReceived = err) });
      const req = httpMock.expectOne(`${API_URL}/register`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      expect(errorReceived.status).toBe(500);
    });
  });


  describe('login()', () => {
    const loginPayload = { email: 'alice@example.com', password: 'secret123' };
    const mockAuthResponse = { id: 1, token: 'jwt-token-xyz', name: 'Alice Smith', email: 'alice@example.com' };

    it('should POST to /login and return an auth response', () => {
      service.login(loginPayload).subscribe((res) => {
        expect(res).toEqual(mockAuthResponse);
      });
      const req = httpMock.expectOne(`${API_URL}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginPayload);
      req.flush(mockAuthResponse);
    });

    it('should send email and password in the request body', () => {
      service.login(loginPayload).subscribe();
      const req = httpMock.expectOne(`${API_URL}/login`);
      expect(req.request.body.email).toBe('alice@example.com');
      expect(req.request.body.password).toBe('secret123');
      req.flush(mockAuthResponse);
    });

    it('should return a token and user metadata in the response', () => {
      service.login(loginPayload).subscribe((res: any) => {
        expect(res.token).toBe('jwt-token-xyz');
        expect(res.id).toBe(1);
        expect(res.name).toBe('Alice Smith');
      });
      const req = httpMock.expectOne(`${API_URL}/login`);
      req.flush(mockAuthResponse);
    });

    it('should propagate 401 error when credentials are wrong', () => {
      let errorReceived: any;
      service.login({ email: 'wrong@x.com', password: 'bad' }).subscribe({ error: (err) => (errorReceived = err) });
      const req = httpMock.expectOne(`${API_URL}/login`);
      req.flush({ message: 'Bad credentials' }, { status: 401, statusText: 'Unauthorized' });
      expect(errorReceived.status).toBe(401);
    });
  });
});
