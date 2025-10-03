export type ProjectRole = 'MANAGER' | 'MEMBER';

export const projectRoles: ProjectRole[] = ['MANAGER', 'MEMBER'];

export function assertProjectRole(role: string): asserts role is ProjectRole {
  if (!projectRoles.includes(role as ProjectRole)) {
    throw new Error('Invalid project role: ' + role);
  }
}
