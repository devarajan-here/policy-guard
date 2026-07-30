import 'server-only';

export type Role = 'EMPLOYEE' | 'HR_ADMIN';

export type Employee = {
  id: string;
  name: string;
  firstName: string;
  role: Role;
  title: string;
  department: string;
  initials: string;
  salary: string;
  leaveBalance: number;
  email: string;
  phone: string;
  manager: string;
  benefits: string;
};

const employees: Record<string, Employee> = {
  'emp-1001': {
    id: 'emp-1001',
    name: 'Priya Sharma',
    firstName: 'Priya',
    role: 'EMPLOYEE',
    title: 'Senior Product Designer',
    department: 'Product Design',
    initials: 'PS',
    salary: '₹18,40,000 per year',
    leaveBalance: 12,
    email: 'priya.sharma@abcpvt.example',
    phone: '+91 98765 04432',
    manager: 'Vikram Rao',
    benefits: 'Family health cover up to ₹8,00,000, term life insurance, and an annual learning allowance of ₹40,000.',
  },
  'emp-1002': {
    id: 'emp-1002',
    name: 'Arjun Mehta',
    firstName: 'Arjun',
    role: 'EMPLOYEE',
    title: 'Software Engineer II',
    department: 'Engineering',
    initials: 'AM',
    salary: '₹16,80,000 per year',
    leaveBalance: 8,
    email: 'arjun.mehta@abcpvt.example',
    phone: '+91 98111 82740',
    manager: 'Meera Iyer',
    benefits: 'Individual health cover up to ₹6,00,000, term life insurance, and an annual learning allowance of ₹35,000.',
  },
  'hr-2001': {
    id: 'hr-2001',
    name: 'Neha Kapoor',
    firstName: 'Neha',
    role: 'HR_ADMIN',
    title: 'People Operations Lead',
    department: 'People Operations',
    initials: 'NK',
    salary: '₹22,50,000 per year',
    leaveBalance: 16,
    email: 'neha.kapoor@abcpvt.example',
    phone: '+91 98990 11562',
    manager: 'Rohan Malhotra',
    benefits: 'Family health cover up to ₹10,00,000, term life insurance, and an annual learning allowance of ₹50,000.',
  },
};

export function getEmployee(id: string) {
  return employees[id] ?? null;
}

export function getPublicUser(employee: Employee) {
  const { id, name, firstName, role, title, department, initials } = employee;
  return { id, name, firstName, role, title, department, initials };
}

export function findMentionedEmployee(input: string) {
  const normalized = input.toLowerCase();
  return Object.values(employees).find(
    (employee) =>
      employee.id !== 'hr-2001' &&
      (normalized.includes(employee.name.toLowerCase()) ||
        normalized.includes(employee.firstName.toLowerCase()) ||
        normalized.includes(employee.id.toLowerCase())),
  );
}
