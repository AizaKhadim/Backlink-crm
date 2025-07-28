// src/pages/Dashboard/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "./Dashboard.css";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartDataLabels
);

const categories = [
  "guest posting",
  "profile creation",
  "micro blogging",
  "directory submission",
  "social bookmarks",
];

const categoryIcons = {
  "guest posting": "📝",
  "profile creation": "👤",
  "micro blogging": "🐦",
  "directory submission": "📁",
  "social bookmarks": "🔖",
};

const Dashboard = () => {
  const [projectCount, setProjectCount] = useState(0);
  const [backlinkCount, setBacklinkCount] = useState(0);
  const [goals, setGoals] = useState([]);
  const [categoryData, setCategoryData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const projectSnap = await getDocs(collection(db, "projects"));
      const projects = projectSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjectCount(projects.length);

      let totalBacklinks = 0;
      const categoryCounts = {};
      for (const cat of categories) {
        let count = 0;
        for (const proj of projects) {
          const snap = await getDocs(collection(db, "projects", proj.id, cat));
          count += snap.size;
        }
        categoryCounts[cat] = count;
        totalBacklinks += count;
      }
      setCategoryData(categoryCounts);
      setBacklinkCount(totalBacklinks);

      let allGoals = [];
      for (const proj of projects) {
        const goalSnap = await getDocs(collection(db, "projects", proj.id, "goals"));
        const projGoals = goalSnap.docs.map((doc) => doc.data());
        allGoals = [...allGoals, ...projGoals];
      }
      setGoals(allGoals);
    };

    fetchData();
  }, []);

  const completedGoals = goals.filter((g) => Number(g.target) <= backlinkCount).length;

  const chartData = {
    labels: categories.map((cat) => `${categoryIcons[cat]} ${cat}`),
    datasets: [
      {
        label: "Backlinks",
        data: categories.map((cat) => categoryData[cat] || 0),
        backgroundColor: [
          "rgba(102, 126, 234, 0.8)",
          "rgba(67, 206, 162, 0.8)",
          "rgba(255, 105, 135, 0.8)",
          "rgba(247, 151, 30, 0.8)",
          "rgba(118, 75, 162, 0.8)",
        ],
        borderRadius: 10,
        barThickness: 40,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      datalabels: {
        color: "#fff",
        anchor: "end",
        align: "start",
        font: {
          weight: "bold",
          size: 14,
        },
        formatter: (val) => val,
      },
      tooltip: {
        callbacks: {
          label: (context) => `Backlinks: ${context.raw}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "#eee",
        },
        ticks: {
          font: {
            size: 12,
            weight: "500",
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 14,
          },
        },
        grid: {
          color: "#f0f0f0",
        },
      },
    },
    animation: {
      duration: 1200,
      easing: "easeOutBounce",
    },
  };

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">📊 Dashboard Overview</h2>

      <div className="dashboard-cards">
        <div className="card summary-card gradient-card">
          <h3>Total Projects</h3>
          <p>{projectCount}</p>
        </div>
        <div className="card summary-card gradient-card2">
          <h3>Total Backlinks</h3>
          <p>{backlinkCount}</p>
        </div>
        <div className="card summary-card gradient-card3">
          <h3>Goals Completed</h3>
          <p>
            {completedGoals} / {goals.length}
          </p>
        </div>
      </div>

      <div className="dashboard-chart glass-card">
        <h3>🚀 Performance by Category</h3>
        <div className="chart-wrapper">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
