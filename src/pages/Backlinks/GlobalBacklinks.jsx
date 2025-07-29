import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useUser } from "../../context/UserContext";
import "./GlobalBacklinks.css";

const categories = [
  "all",
  "guest posting",
  "profile creation",
  "micro blogging",
  "directory submission",
  "social bookmarks",
];

const GlobalBacklinks = () => {
  const { role } = useUser();
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [backlinks, setBacklinks] = useState({});
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [editRowId, setEditRowId] = useState(null);
  const [editData, setEditData] = useState({});
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

const showToast = (message, type = "success") => {
  setToast({ visible: true, message, type });
  setTimeout(() => {
    setToast({ visible: false, message: "", type: "success" });
  }, 4000);
};


  useEffect(() => {
  const fetchAllBacklinks = async () => {
    setLoading(true);
    const backlinksByCategory = {};

    const projectsSnapshot = await getDocs(collection(db, "projects"));
    const projectData = {};

    for (const docSnap of projectsSnapshot.docs) {
      const data = docSnap.data();
      // ❗ Exclude deleted projects
      if (!data.isDeleted) {
        projectData[docSnap.id] = data;
      }
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

  const selectedProject = prompt(
    "Please enter a default project name (used if Excel row has no project name):"
  )?.trim();

  if (!selectedProject) {
    showToast("Project selection is required.", "error");

    return;
  }

  const defaultProjectMatch = Object.entries(projects).find(
    ([, data]) => data.title.trim().toLowerCase() === selectedProject.toLowerCase()
  );

  if (!defaultProjectMatch) {
    showToast(`Project "${selectedProject}" not found.`, "error");

    return;
  }

  const [defaultProjectId, defaultProjectData] = defaultProjectMatch;

  const reader = new FileReader();
  reader.onload = async (event) => {
    const binaryStr = event.target.result;
    const workbook = XLSX.read(binaryStr, { type: "binary" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    let successCount = 0;
    let skippedRows = [];

    const newBacklinksByCategory = { ...backlinks };

    for (const entry of jsonData) {
      const rawCategory = (entry.Category || "").toLowerCase().trim();
      const matchedCategory = categories.find(
        (cat) => cat !== "all" && cat.toLowerCase() === rawCategory
      );
      const categoryToUse = matchedCategory || null;

      const excelProjectName = entry.Project?.trim();
      let matchedProject = null;

      if (excelProjectName) {
        matchedProject = Object.entries(projects).find(
          ([, data]) => data.title.trim().toLowerCase() === excelProjectName.toLowerCase()
        );
      }

      const finalProjectId = matchedProject
        ? matchedProject[0]
        : defaultProjectId;

      const finalProjectTitle = matchedProject
        ? matchedProject[1].title
        : defaultProjectData.title;

      if (!finalProjectId) {
        skippedRows.push(entry);
        continue;
      }

      const commonData = {
        date: entry.Date || "",
        website: entry.Website || "",
        da: entry.DA || "",
        spamScore: entry.SpamScore || "",
        username: entry.Username || "",
        password: entry.Password || "",
        link: entry.Link || "",
        notes: entry.Notes || "",
        projectTitle: finalProjectTitle,
      };

      try {
        // Add to "all"
        const docRefAll = await addDoc(collection(db, "projects", finalProjectId, "all"), {
          ...commonData,
          category: rawCategory || "uncategorized",
        });

        const allEntry = {
          ...commonData,
          category: rawCategory || "uncategorized",
          id: docRefAll.id,
          projectId: finalProjectId,
        };

        if (!newBacklinksByCategory["all"]) newBacklinksByCategory["all"] = [];
        newBacklinksByCategory["all"].push(allEntry);

        // Add to specific category if matched
        if (categoryToUse) {
          const docRef = await addDoc(collection(db, "projects", finalProjectId, categoryToUse), {
            ...commonData,
            category: categoryToUse,
          });

          const newEntry = {
            ...commonData,
            category: categoryToUse,
            id: docRef.id,
            projectId: finalProjectId,
          };

          if (!newBacklinksByCategory[categoryToUse]) {
            newBacklinksByCategory[categoryToUse] = [];
          }
          newBacklinksByCategory[categoryToUse].push(newEntry);
        }

        successCount++;
      } catch (err) {
        console.error("Error adding backlink:", err);
        skippedRows.push(entry);
      }
    }

    setBacklinks(newBacklinksByCategory);
    showToast(`✅ Imported: ${successCount} • ❌ Skipped: ${skippedRows.length}`, "success");


    if (skippedRows.length > 0) {
      console.warn("Skipped Rows:", skippedRows);
    }
  };

  reader.readAsBinaryString(file);
};



  const handleEdit = (link) => {
    setEditRowId(link.id);
    setEditData({
      username: link.username,
      password: link.password,
      link: link.link,
      notes: link.notes,
    });
  };

  const handleUpdate = async (link) => {
    const docRef = doc(db, "projects", link.projectId, link.category, link.id);
    await updateDoc(docRef, editData);

    const updatedLinks = backlinks[activeCategory].map((l) =>
      l.id === link.id ? { ...l, ...editData } : l
    );

    setBacklinks({ ...backlinks, [activeCategory]: updatedLinks });
    setEditRowId(null);
    setEditData({});
  };

  return (
    <div className="global-backlinks-page">
      <h2>Backlinks - All Projects</h2>

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

      <div className="import-export-bar">
        <button onClick={handleExportToExcel} className="export-btn">
          Export to Excel
        </button>

        <label className="import-label">
          <div className="import-btn">Import from Excel</div>
          <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} />
        </label>
      </div>
       {toast.visible && (
      <div className={`toast ${toast.type}`}>
        {toast.message}
      </div>
    )}

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
              {["admin", "editor"].includes(role) && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(link => {
              const isEditing = editRowId === link.id;
              return (
                <tr key={link.id}>
                  <td>{link.projectTitle}</td>
                  <td>{link.date}</td>
                  <td>{link.website}</td>
                  <td>{link.da}</td>
                  <td>{link.spamScore}</td>

                  {isEditing ? (
                    <>
                      <td><input value={editData.username} onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))} /></td>
                      <td><input value={editData.password} onChange={(e) => setEditData(prev => ({ ...prev, password: e.target.value }))} /></td>
                      <td><input value={editData.link} onChange={(e) => setEditData(prev => ({ ...prev, link: e.target.value }))} /></td>
                      <td>{link.category}</td>
                      <td><textarea value={editData.notes} onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))} /></td>
                      <td><button onClick={() => handleUpdate(link)}>Update</button></td>
                    </>
                  ) : (
                    <>
                      <td>{link.username}</td>
                      <td>{link.password}</td>
                      <td>
                        <a href={link.link} target="_blank" rel="noreferrer">{link.link}</a>
                      </td>
                      <td>{link.category}</td>
                      <td>{link.notes}</td>
                      {["admin", "editor"].includes(role) && (
                        <td><button onClick={() => handleEdit(link)}>Edit</button></td>
                      )}
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default GlobalBacklinks;
