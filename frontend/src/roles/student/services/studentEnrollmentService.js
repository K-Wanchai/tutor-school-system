import api from '../../../shared/services/api';

export async function getAvailableCourses() {
  const response = await api.get('/courses', {
    params: {
      page: 0,
      size: 50,
    },
  });

  return response.data.data;
}

export async function getMyEnrollments() {
  const response = await api.get('/enrollments/my');
  return response.data.data;
}

export async function enrollCourse(courseId) {
  const response = await api.post('/enrollments/my', {
    courseId,
    paymentMethod: 'BANK_TRANSFER',
    note: '',
  });

  return response.data.data;
}