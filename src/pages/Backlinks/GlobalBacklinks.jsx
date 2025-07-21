import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import "./GlobalBacklinks.css";

const categories = [
  "guest posting",
  "profile creation",
  "micro blogging",
  "directory submission",
  "social bookmarks",
];

const GlobalBacklinks = () => {
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [backlinks, setBacklinks] = useState({});
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const fetchAllBacklinks = async () => {
      setLoading(true);
      const backlinksByCategory = {};

      const projectsSnapshot = await getDocs(collection(db, "projects"));
      const projectData = {};
      for (const docSnap of projectsSnapshot.docs) {
        projectData[docSnap.id] = docSnap.data();
      }
      setProjects(projectData);

      for (const category of categories) {
        const allLinks = [];

        for (const projectId of Object.keys(projectData)) {
          const subCollectionRef = collection(db, "projects", projectId, category);
          const linksSnapshot = await getDocs(subCollectionRef);
          const links = linksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            projectId,
            projectTitle: projectData[projectId]?.title || "Unknown",
            category,
          }));
          allLinks.push(...links);
        }

        backlinksByCategory[category] = allLinks;
      }

      setBacklinks(backlinksByCategory);
      setLoading(false);
    };

    fetchAllBacklinks();
  }, []);

  const filtered = backlinks[activeCategory]?.filter(entry => {
    const matchesSearch =
      entry.website?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.link?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = !selectedDate || entry.date === selectedDate;

    return matchesSearch && matchesDate;
  }) || [];

  return (
    <div className="global-backlinks-page">
      <h2>Backlinks - All Projects</h2>

      {/* Category Tabs */}
      <div className="tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`tab ${cat === activeCategory ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search + Date Filter */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by website, link, or project..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-filter"
        />
      </div>

      {loading ? (
        <p>Loading backlinks...</p>
      ) : filtered.length === 0 ? (
        <p>No backlinks found for this category.</p>
      ) : (
        <table className="backlink-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Date</th>
              <th>Website</th>
              <th>DA</th>
              <th>Spam Score</th>
              <th>Username</th>
              <th>Password</th>
              <th>Link</th>
              <th>Category</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(link => (
              <tr key={link.id}>
                <td>{link.projectTitle}</td>
                <td>{link.date}</td>
                <td>{link.website}</td>
                <td>{link.da}</td>
                <td>{link.spamScore}</td>
                <td>{link.username}</td>
                <td>{link.password}</td>
                <td>
                  <a href={link.link} target="_blank" rel="noreferrer">
                    {link.link}
                  </a>
                </td>
                <td>{link.category}</td>
                <td>{link.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default GlobalBacklinks;
