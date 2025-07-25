import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useUser } from "../../context/UserContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./ProjectDetails.css";

const backlinkCategories = [
  "guest posting",
  "profile creation",
  "micro blogging",
  "directory submission",
  "social bookmarks",
];

const ProjectDetails = () => {
  const { id } = useParams();
  const { role } = useUser();
  const [project, setProject] = useState(null);
  const [backlinksByCategory, setBacklinksByCategory] = useState({});
  const [formData, setFormData] = useState({
    date: "",
    website: "",
    da: "",
    spamScore: "",
    username: "",
    password: "",
    link: "",
    category: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchProjectAndBacklinks();
  }, [id]);

  const fetchProjectAndBacklinks = async () => {
    try {
      const docRef = doc(db, "projects", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProject(docSnap.data());
      }

      const newBacklinksByCategory = {};
      for (const cat of backlinkCategories) {
        const snapshot = await getDocs(collection(db, "projects", id, cat));
        newBacklinksByCategory[cat] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }

      setBacklinksByCategory(newBacklinksByCategory);
      setLoading(false);
    } catch (err) {
      console.error("Error loading project details:", err);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddBacklink = async () => {
    const {
      date,
      website,
      da,
      spamScore,
      username,
      password,
      link,
      category,
      notes,
    } = formData;

    if (!date || !website || !da || !spamScore || !username || !password || !link || !category) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      await addDoc(collection(db, "projects", id, category), {
        ...formData,
        createdAt: serverTimestamp(),
      });

      setFormData({
        date: "",
        website: "",
        da: "",
        spamScore: "",
        username: "",
        password: "",
        link: "",
        category: "",
        notes: "",
      });
      setSuccess("✅ Backlink added!");
      setShowModal(false);
      fetchProjectAndBacklinks();
    } catch (err) {
      console.error("Error adding backlink:", err);
    }
  };

  const handleExportToExcel = () => {
    const allLinks = [];
    for (const [category, links] of Object.entries(backlinksByCategory)) {
      links.forEach(link => {
        allLinks.push({
          Date: link.date,
          Website: link.website,
          DA: link.da,
          SpamScore: link.spamScore,
          Username: link.username,
          Password: link.password,
          Link: link.link,
          Notes: link.notes,
          Category: category,
        });
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(allLinks);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Backlinks");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `${project?.title || "Project"}-Backlinks.xlsx`);
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

      for (const entry of jsonData) {
        const category = (entry.Category || "").toLowerCase();
        if (!backlinkCategories.includes(category)) continue;

        await addDoc(collection(db, "projects", id, category), {
          date: entry.Date || "",
          website: entry.Website || "",
          da: entry.DA || "",
          spamScore: entry.SpamScore || "",
          username: entry.Username || "",
          password: entry.Password || "",
          link: entry.Link || "",
          notes: entry.Notes || "",
          category,
          createdAt: serverTimestamp(),
        });
      }

      alert("Import complete!");
      fetchProjectAndBacklinks();
    };

    reader.readAsBinaryString(file);
  };

  if (loading) return <p>Loading project...</p>;

  return (
    <div className="project-details-page">
      <h2>{project?.title}</h2>
      <p>{project?.description}</p>

      <div className="import-export-bar">
        <button onClick={handleExportToExcel} className="export-btn">
          Export to Excel
        </button>

        <label className="import-label">
          <div className="import-btn">Import from Excel</div>
          <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} />
        </label>
      </div>

      <h3>Backlink Categories</h3>

      {Object.entries(backlinksByCategory).map(([category, links]) => (
        <div key={category} className="category-block">
          <h4>{category}</h4>
          {links.length === 0 ? (
            <p>No backlinks yet in this category.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Website</th>
                  <th>DA</th>
                  <th>Spam Score</th>
                  <th>Username</th>
                  <th>Password</th>
                  <th>Link</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id}>
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
                    <td>{link.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {role !== "viewer" && (
        <>
          <button className="open-modal-btn" onClick={() => setShowModal(true)}>
            ➕ Add Backlink
          </button>

          {showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <button className="close-modal-btn" onClick={() => setShowModal(false)}>×</button>
                <h3>Add New Backlink</h3>
                <div className="backlink-form">
                  <input name="date" type="date" value={formData.date} onChange={handleInputChange} />
                  <input name="website" value={formData.website} onChange={handleInputChange} placeholder="Website" />
                  <input name="da" value={formData.da} onChange={handleInputChange} placeholder="DA" />
                  <input name="spamScore" value={formData.spamScore} onChange={handleInputChange} placeholder="Spam Score" />
                  <input name="username" value={formData.username} onChange={handleInputChange} placeholder="Username" />
                  <input name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" />
                  <input name="link" value={formData.link} onChange={handleInputChange} placeholder="Backlink URL" />
                  <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Notes" />
                  <select name="category" value={formData.category} onChange={handleInputChange}>
                    <option value="">Select Category</option>
                    {backlinkCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button onClick={handleAddBacklink}>Add Backlink</button>
                  {success && <p className="success-text">{success}</p>}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectDetails;
