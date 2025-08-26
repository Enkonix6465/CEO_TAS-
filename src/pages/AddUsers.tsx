import React, { useState, useEffect } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  setDoc,
  doc,
  deleteDoc,
  getDocs,
  collection,
} from "firebase/firestore";
import { Search, Edit, Trash2, UserPlus, Users } from "lucide-react";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  photo: string;
  title: string;
  department: string;
  type: string;
  joiningDate: string;
  manager: string;
  location: string;
  status: string;
}


export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState<Employee>({
    id: "",
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    photo: "",
    title: "",
    department: "",
    type: "Full-time",
    joiningDate: "",
    manager: "",
    location: "",
    status: "Active",
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchEmployees = async () => {
      const snapshot = await getDocs(collection(db, "employees"));
      const data = snapshot.docs.map((doc) => doc.data() as Employee);
      setEmployees(data);
    };
    fetchEmployees();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createAuthUser = async (emp: Employee) => {
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        emp.email,
        "123456"
      );
      emp.id = userCred.user.uid;
      return emp;
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        return emp;
      } else {
        throw error;
      }
    }
  };

  const saveToDatabase = async (emp: Employee) => {
    // If emp.id is empty, generate a new doc ref and set the id
    if (!emp.id) {
      const dbRef = doc(collection(db, 'employees'));
      emp.id = dbRef.id;
      await setDoc(dbRef, emp);
    } else {
      await setDoc(doc(db, 'employees', emp.id), emp);
    }
  };

  const handleAddOrUpdate = async () => {
    if (!form.name || !form.email || !form.employeeId) return alert("Please fill required fields");

    setLoading(true);
    try {
      const updatedForm = await createAuthUser(form);
      await saveToDatabase(updatedForm);

      if (editIndex !== null) {
        const updated = [...employees];
        updated[editIndex] = updatedForm;
        setEmployees(updated);
        setEditIndex(null);
      } else {
        setEmployees([...employees, updatedForm]);
      }

      setForm({
        id: "",
        employeeId: "",
        name: "",
        email: "",
        phone: "",
        gender: "",
        dob: "",
        photo: "",
        title: "",
        department: "",
        type: "Full-time",
        joiningDate: "",
        manager: "",
        location: "",
        status: "Active",
      });

      setMessage("Employee added successfully!");
    } catch (err: any) {
      alert("Failed to add employee: " + err.message);
    }
    setLoading(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleEdit = (index: number) => {
    setForm(employees[index]);
    setEditIndex(index);
  };

  const handleDelete = async (index: number) => {
    const emp = employees[index];
    await deleteDoc(doc(db, "employees", emp.id));
    const updated = [...employees];
    updated.splice(index, 1);
    setEmployees(updated);
  };



  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-700 dark:text-blue-400 animate-fade-in-down">
        Employee Management
      </h2>

      {loading && (
        <div className="text-blue-600 dark:text-blue-400 mb-3 animate-fade-in">
          Loading...
        </div>
      )}
      {message && (
        <div className="text-green-600 dark:text-green-400 mb-3 animate-fade-in">
          {message}
        </div>
      )}


      <div className="bg-white dark:bg-gray-800 shadow-lg p-4 rounded mb-8 animate-slide-up">
        <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Add / Edit Employee
        </h3>
        <form
          onSubmit={e => { e.preventDefault(); handleAddOrUpdate(); }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="col-span-1 sm:col-span-2 md:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">Full Name<span className="text-red-500">*</span></label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="employeeId">Employee ID<span className="text-red-500">*</span></label>
              <input
                id="employeeId"
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
                placeholder="Employee ID"
                className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">Email<span className="text-red-500">*</span></label>
              <input
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                type="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone"
                className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="photo">Photo URL</label>
              <input
                id="photo"
                name="photo"
                value={form.photo}
                onChange={handleChange}
                placeholder="Photo URL"
                className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="dob">Date of Birth<span className="text-red-500">*</span></label>
              <input
                id="dob"
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="joiningDate">Joining Date</label>
              <input
                id="joiningDate"
                type="date"
                name="joiningDate"
                value={form.joiningDate}
                onChange={handleChange}
                className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="title">Job Title</label>
              <input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Job Title"
                className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="department">Department</label>
              <input
                id="department"
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="Department"
                className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="manager">Manager</label>
              <input
                id="manager"
                name="manager"
                value={form.manager}
                onChange={handleChange}
                placeholder="Manager"
                className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Location"
                className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="type">Employment Type</label>
              <select
                id="type"
                name="type"
                value={form.type}
                onChange={handleChange}
                className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Intern</option>
                <option>Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>Terminated</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition duration-200 col-span-1 sm:col-span-2 md:col-span-4 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {editIndex !== null ? "Update" : "Add"} Employee
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-lg p-4 rounded animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Employees ({employees.filter(emp =>
              (emp.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
              (emp.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
              (emp.department?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            ).length})
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border text-sm min-w-[800px]">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
              <tr>
                <th className="border px-2 py-2">Photo</th>
                <th className="border px-2 py-2">Name</th>
                <th className="border px-2 py-2">Employee ID</th>
                <th className="border px-2 py-2">Email</th>
                <th className="border px-2 py-2">Phone</th>
                <th className="border px-2 py-2">Department</th>
                <th className="border px-2 py-2">Date of Birth</th>
                <th className="border px-2 py-2">Status</th>
                <th className="border px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees
                .filter(emp =>
                  (emp.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                  (emp.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                  (emp.department?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                  (emp.employeeId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                )
                .map((emp, idx) => (
                <tr
                  key={idx}
                  className="text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <td className="border px-2 py-2">
                    {emp.photo ? (
                      <img
                        src={emp.photo}
                        alt={emp.name}
                        className="h-10 w-10 rounded-full mx-auto object-cover"
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="border px-2 py-2">{emp.name}</td>
                  <td className="border px-2 py-2">{emp.employeeId}</td>
                  <td className="border px-2 py-2">{emp.email}</td>
                  <td className="border px-2 py-2">{emp.phone}</td>
                  <td className="border px-2 py-2">{emp.department}</td>
                  <td className="border px-2 py-2">{emp.dob}</td>
                  <td className="border px-2 py-2">{emp.status}</td>
                  <td className="border px-2 py-2 space-x-2">
                    <button
                      onClick={() => handleEdit(employees.indexOf(emp))}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded flex items-center gap-1 inline-flex"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(employees.indexOf(emp))}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center gap-1 inline-flex"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
