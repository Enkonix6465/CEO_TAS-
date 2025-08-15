import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { Star, MessageSquare, Users, Search, Filter, Award, TrendingUp } from "lucide-react";

const FeedbackPage = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [search, setSearch] = useState("");

  const [showFeedbackFor, setShowFeedbackFor] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState(0);

  useEffect(() => {
    const fetchEmployees = async () => {
      const snapshot = await getDocs(collection(db, "employees"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEmployees(data);
      setFilteredEmployees(data);
    };

    fetchEmployees();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    const filtered = employees.filter((emp) =>
      emp.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || rating === 0) {
      alert("Please select an employee and give a star rating.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const docId = `${selectedEmployee.id}_${today}`;
    const feedbackRef = doc(db, "HR_feedback", docId);

    await setDoc(feedbackRef, {
      employeeId: selectedEmployee.id,
      name: selectedEmployee.name,
      email: selectedEmployee.email,
      stars: rating,
      score: rating * 20,
      comment,
      timestamp: Timestamp.now(),
    });

    alert("Feedback submitted successfully!");
    setRating(0);
    setHover(0);
    setComment("");
    setSelectedEmployee(null);
  };

  const fetchFeedbacks = async (empId) => {
    setShowFeedbackFor(empId);
    const snapshot = await getDocs(collection(db, "HR_feedback"));
    const filtered = snapshot.docs
      .map((doc) => doc.data())
      .filter((f) => f.employeeId === empId);
    setFeedbackList(filtered);
  };

  const filteredFeedbacks = feedbackFilter
    ? feedbackList.filter((f) => f.stars === feedbackFilter)
    : feedbackList;

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getStarColor = (index, hover, rating) => {
    return index <= (hover || rating) - 1 ? "text-yellow-400" : "text-gray-300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                HR Feedback System
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Evaluate employee performance and track feedback history
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {employees.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Employees</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {feedbackList.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Feedbacks</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {feedbackList.length > 0 
                      ? Math.round(feedbackList.reduce((acc, f) => acc + f.score, 0) / feedbackList.length)
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Average Score</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employee by name..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {/* Employee Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Employee Directory
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredEmployees.map((emp) => (
              <div
                key={emp.id}
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-2 transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                  selectedEmployee?.id === emp.id 
                    ? "border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800" 
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {emp.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">{emp.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{emp.email}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedEmployee(emp)}
                    className="flex-1 px-3 py-2 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    Give Feedback
                  </button>
                  <button
                    onClick={() => fetchFeedbacks(emp.id)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    View History
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Form */}
        {selectedEmployee && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Feedback for{" "}
                <span className="text-blue-600 dark:text-blue-400">{selectedEmployee.name}</span>
              </h2>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Performance Rating
              </label>
              <div className="flex items-center gap-2 mb-2">
                {[...Array(5)].map((_, index) => {
                  const starValue = index + 1;
                  return (
                    <label key={index} className="cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        value={starValue}
                        onClick={() => setRating(starValue)}
                        className="hidden"
                      />
                      <Star
                        size={32}
                        className={`transition-colors ${getStarColor(index, hover, rating)} hover:scale-110`}
                        onMouseEnter={() => setHover(starValue)}
                        onMouseLeave={() => setHover(0)}
                        fill={index <= (hover || rating) - 1 ? "currentColor" : "none"}
                      />
                    </label>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getScoreColor(rating * 20)}`}>
                  Score: {rating * 20}/100
                </span>
                {rating > 0 && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({rating} star{rating !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comments (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about this employee's performance..."
                rows={4}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selectedEmployee || rating === 0}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Award className="w-5 h-5" />
              Submit Feedback
            </button>
          </div>
        )}

        {/* Feedback History */}
        {showFeedbackFor && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                Feedback History
              </h3>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={feedbackFilter}
                  onChange={(e) => setFeedbackFilter(Number(e.target.value))}
                  className="border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={0}>All Ratings</option>
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={2}>2 Stars</option>
                  <option value={1}>1 Star</option>
                </select>
              </div>
            </div>

            {filteredFeedbacks.length > 0 ? (
              <div className="space-y-4">
                {filteredFeedbacks.map((f, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {[...Array(f.stars)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" />
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getScoreColor(f.score)}`}>
                          {f.score}/100
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(f.timestamp.seconds * 1000).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    {f.comment && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            {f.comment}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No feedback found for the selected criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
