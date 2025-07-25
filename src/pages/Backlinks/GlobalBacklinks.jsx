import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
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

  const handleExportToExcel = () => {
    const dataToExport = filtered.map((link) => ({
      Project: link.projectTitle,
      Date: link.date,
      Website: link.website,
      DA: link.da,
      SpamScore: link.spamScore,
      Username: link.username,
      Password: link.password,
      Link: link.link,
      Category: link.category,
      Notes: link.notes,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Backlinks");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `Backlinks-${activeCategory}.xlsx`);
  };

 const handleImportExcel = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    const binaryStr = event.target.result;
    const workbook = XLSX.read(binaryStr, { type: "binary" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    const newBacklinksByCategory = { ...backlinks };

    for (const entry of jsonData) {
      const category = (entry.Category || "").toLowerCase();
      const projectTitle = entry.Project?.trim();
      const matchedProject = Object.entries(projects).find(
        ([, data]) => data.title === projectTitle
      );

      if (!matchedProject || !categories.includes(category)) continue;

      const [projectId] = matchedProject;

      const docRef = await addDoc(collection(db, "projects", projectId, category), {
        date: entry.Date || "",
        website: entry.Website || "",
        da: entry.DA || "",
        spamScore: entry.SpamScore || "",
        username: entry.Username || "",
        password: entry.Password || "",
        link: entry.Link || "",
        category,
        notes: entry.Notes || "",
      });

      const newEntry = {
        id: docRef.id,
        projectId,
        projectTitle,
        date: entry.Date || "",
        website: entry.Website || "",
        da: entry.DA || "",
        spamScore: entry.SpamScore || "",
        username: entry.Username || "",
        password: entry.Password || "",
        link: entry.Link || "",
        category,
        notes: entry.Notes || "",
      };

      // Push to correct category in state
      if (!newBacklinksByCategory[category]) {
        newBacklinksByCategory[category] = [];
      }
      newBacklinksByCategory[category].push(newEntry);
    }

    setBacklinks(newBacklinksByCategory); // ✅ this updates the table live
    alert("Excel data imported successfully!");
  };

  reader.readAsBinaryString(file);
};


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

      {/* Export/Import Buttons */}
      <div className="import-export-bar">
        <button onClick={handleExportToExcel} className="export-btn">
          Export to Excel
        </button>

        <label className="import-label">
          <div className="import-btn">Import from Excel</div>
          <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} />
        </label>
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
