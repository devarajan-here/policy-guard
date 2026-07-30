import 'server-only';

export type Role = 'EMPLOYEE' | 'HR_ADMIN' | 'SYSTEM_ADMIN';

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
  'adm-3001': {
    id: 'adm-3001',
    name: 'Karthik Menon',
    firstName: 'Karthik',
    role: 'SYSTEM_ADMIN',
    title: 'Platform Administrator',
    department: 'IT & Security',
    initials: 'KM',
    salary: 'Restricted',
    leaveBalance: 0,
    email: 'karthik.menon@abcpvt.example',
    phone: '+91 90000 30001',
    manager: 'Technology Office',
    benefits: 'Not available to the system-administrator role.',
  },
};

export function getEmployee(id: string) {
  return employees[id] ?? null;
}

export function getAllEmployees() {
  return Object.values(employees).map(getPublicUser);
}

export function addEmployee(data: { id?: string; name: string; email: string; role: string; title?: string; department?: string }) {
  const role: Role = data.role === 'Admin' || data.role === 'SYSTEM_ADMIN' ? 'SYSTEM_ADMIN' : data.role === 'HR' || data.role === 'HR_ADMIN' ? 'HR_ADMIN' : 'EMPLOYEE';
  const id = data.id || `${role === 'SYSTEM_ADMIN' ? 'adm' : role === 'HR_ADMIN' ? 'hr' : 'emp'}-${Date.now().toString().slice(-4)}`;
  const firstName = data.name.split(' ')[0] || data.name;
  const initials = data.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'US';

  const newEmployee: Employee = {
    id,
    name: data.name,
    firstName,
    role,
    title: data.title || (role === 'SYSTEM_ADMIN' ? 'System Administrator' : role === 'HR_ADMIN' ? 'HR Operations Specialist' : 'Employee Specialist'),
    department: data.department || (role === 'SYSTEM_ADMIN' ? 'IT & Security' : role === 'HR_ADMIN' ? 'People Operations' : 'General & Tech'),
    initials,
    salary: '₹17,50,000 per year',
    leaveBalance: 14,
    email: data.email,
    phone: '+91 98000 ' + Math.floor(10000 + Math.random() * 90000),
    manager: 'Department Manager',
    benefits: 'Full health insurance cover, term life insurance, learning & wellness budget.',
  };

  employees[id] = newEmployee;
  return newEmployee;
}

export function getPublicUser(employee: Employee) {
  const { id, name, firstName, role, title, department, initials } = employee;
  return { id, name, firstName, role, title, department, initials };
}

export function findMentionedEmployee(input: string) {
  const normalized = input.toLowerCase();
  return Object.values(employees).find(
    (employee) =>
      employee.role === 'EMPLOYEE' &&
      (normalized.includes(employee.name.toLowerCase()) ||
        normalized.includes(employee.firstName.toLowerCase()) ||
        normalized.includes(employee.id.toLowerCase())),
  );
}
