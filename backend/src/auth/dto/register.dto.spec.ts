import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  it('trims username before validation', async () => {
    const dto = plainToInstance(RegisterDto, {
      username: '  tester  ',
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(dto.username).toBe('tester');
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects usernames that are too short after trimming', async () => {
    const dto = plainToInstance(RegisterDto, {
      username: ' ab ',
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(dto.username).toBe('ab');
    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'username',
        }),
      ]),
    );
  });

  it('leaves non-string username values for string validation to reject', async () => {
    const dto = plainToInstance(RegisterDto, {
      username: 42,
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(dto.username).toBe(42);
    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'username',
        }),
      ]),
    );
  });
});
