'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { UserRound, Download, Sparkles, Save, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { generateGeminiResponse } from '@/lib/utils/gemini';
// jsPDF will be dynamically imported

interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
}

export default function ResumeBuilderPage() {
  const { user } = useAuth();
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      name: user?.displayName || '',
      email: user?.email || '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [apiKeyWarning, setApiKeyWarning] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadGeminiKey = () => {
      if (!user?.uid) {
        setApiKeyWarning('Add your Gemini API key in the API Integration tab to use AI generation.');
      }

      const tryParseKeys = (storageKey: string) => {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return null;
        try {
          const stored = JSON.parse(raw) as Array<{ service: string; key: string }>;
          return (
            stored.find((entry) =>
              entry.service.toLowerCase().includes('gemini') ||
              entry.service.toLowerCase().includes('google')
            )?.key ?? null
          );
        } catch (error) {
          console.error('Failed to parse API keys from storage key:', storageKey, error);
          return null;
        }
      };

      // Try user-specific key first
      if (user?.uid) {
        const key = tryParseKeys(`apiKeys_${user.uid}`);
        if (key) {
          setGeminiApiKey(key);
          setApiKeyWarning(null);
          return;
        }
      }

      // Fallback: search all apiKeys_* entries
      for (let i = 0; i < localStorage.length; i += 1) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey.startsWith('apiKeys_')) {
          const key = tryParseKeys(storageKey);
          if (key) {
            setGeminiApiKey(key);
            setApiKeyWarning(null);
            return;
          }
        }
      }

      setGeminiApiKey(null);
      setApiKeyWarning('Gemini API key not found. Add a key (service name "Gemini" or "Google") in the API Integration tab to enable AI generation.');
    };

    loadGeminiKey();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key.startsWith('apiKeys_')) {
        loadGeminiKey();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const generateWithAI = async (section: string) => {
    if (!geminiApiKey) {
      alert('Gemini API key not found. Add your Gemini API key (service: "Gemini" or "Google") in the API Integration tab to use AI generation.');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Generate professional ${section} content for an AI/ML engineer resume. Return only the content, no explanations. Make it concise and impactful.`;
      const content = await generateGeminiResponse(prompt, undefined, undefined, geminiApiKey);
      
      if (section === 'summary') {
        setResumeData({ ...resumeData, summary: content });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate content. Please check your Gemini API key.';
      alert(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 107, 53);
    doc.text(resumeData.personalInfo.name, 20, yPos);
    yPos += 10;

    // Contact Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const contactInfo = [
      resumeData.personalInfo.email,
      resumeData.personalInfo.phone,
      resumeData.personalInfo.location,
    ].filter(Boolean).join(' | ');
    doc.text(contactInfo, 20, yPos);
    yPos += 15;

    // Summary
    if (resumeData.summary) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Professional Summary', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const summaryLines = doc.splitTextToSize(resumeData.summary, 170);
      doc.text(summaryLines, 20, yPos);
      yPos += summaryLines.length * 5 + 10;
    }

    // Skills
    if (resumeData.skills.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Skills', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(resumeData.skills.join(', '), 20, yPos);
      yPos += 10;
    }

    // Experience
    if (resumeData.experience.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Experience', 20, yPos);
      yPos += 8;
      resumeData.experience.forEach((exp) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(exp.title, 20, yPos);
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${exp.company} | ${exp.duration}`, 20, yPos);
        yPos += 6;
        const descLines = doc.splitTextToSize(exp.description, 170);
        doc.text(descLines, 20, yPos);
        yPos += descLines.length * 5 + 5;
      });
    }

    // Education
    if (resumeData.education.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Education', 20, yPos);
      yPos += 8;
      resumeData.education.forEach((edu) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(edu.degree, 20, yPos);
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${edu.institution} | ${edu.year}`, 20, yPos);
        yPos += 10;
      });
    }

    // Projects
    if (resumeData.projects.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Projects', 20, yPos);
      yPos += 8;
      resumeData.projects.forEach((proj) => {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(proj.name, 20, yPos);
        yPos += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(proj.description, 170);
        doc.text(descLines, 20, yPos);
        yPos += descLines.length * 5 + 5;
        if (proj.technologies.length > 0) {
          doc.text(`Technologies: ${proj.technologies.join(', ')}`, 20, yPos);
          yPos += 6;
        }
        yPos += 3;
      });
    }

    doc.save('resume.pdf');
  };

  const addExperience = () => {
    setResumeData({
      ...resumeData,
      experience: [...resumeData.experience, { title: '', company: '', duration: '', description: '' }],
    });
  };

  const addEducation = () => {
    setResumeData({
      ...resumeData,
      education: [...resumeData.education, { degree: '', institution: '', year: '' }],
    });
  };

  const addProject = () => {
    setResumeData({
      ...resumeData,
      projects: [...resumeData.projects, { name: '', description: '', technologies: [] }],
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-title mb-2 flex items-center gap-3">
            <UserRound className="w-8 h-8 text-primary" />
            Resume Builder
          </h1>
          <p className="text-body">
            Create a professional AI/ML engineer resume with AI assistance
          </p>
          {apiKeyWarning && (
            <div className="mt-4 p-3 bg-yellow-500/15 border border-yellow-500/40 rounded-lg text-sm text-yellow-200">
              {apiKeyWarning}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Info */}
            <div className="glass p-6 rounded-xl">
              <h2 className="text-section mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={resumeData.personalInfo.name}
                  onChange={(e) => setResumeData({
                    ...resumeData,
                    personalInfo: { ...resumeData.personalInfo, name: e.target.value }
                  })}
                  className="w-full px-4 py-2 bg-card text-text rounded-lg"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={resumeData.personalInfo.email}
                  onChange={(e) => setResumeData({
                    ...resumeData,
                    personalInfo: { ...resumeData.personalInfo, email: e.target.value }
                  })}
                  className="w-full px-4 py-2 bg-card text-text rounded-lg"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={resumeData.personalInfo.phone}
                  onChange={(e) => setResumeData({
                    ...resumeData,
                    personalInfo: { ...resumeData.personalInfo, phone: e.target.value }
                  })}
                  className="w-full px-4 py-2 bg-card text-text rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={resumeData.personalInfo.location}
                  onChange={(e) => setResumeData({
                    ...resumeData,
                    personalInfo: { ...resumeData.personalInfo, location: e.target.value }
                  })}
                  className="w-full px-4 py-2 bg-card text-text rounded-lg"
                />
                <input
                  type="text"
                  placeholder="LinkedIn URL"
                  value={resumeData.personalInfo.linkedin}
                  onChange={(e) => setResumeData({
                    ...resumeData,
                    personalInfo: { ...resumeData.personalInfo, linkedin: e.target.value }
                  })}
                  className="w-full px-4 py-2 bg-card text-text rounded-lg"
                />
                <input
                  type="text"
                  placeholder="GitHub URL"
                  value={resumeData.personalInfo.github}
                  onChange={(e) => setResumeData({
                    ...resumeData,
                    personalInfo: { ...resumeData.personalInfo, github: e.target.value }
                  })}
                  className="w-full px-4 py-2 bg-card text-text rounded-lg"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="glass p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-section">Professional Summary</h2>
                <button
                  onClick={() => generateWithAI('summary')}
                  disabled={isGenerating || !geminiApiKey}
                  title={geminiApiKey ? undefined : 'Add your Gemini API key in API Integration to enable AI generation'}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    geminiApiKey
                      ? 'bg-primary hover:bg-primary/90 text-white disabled:opacity-50'
                      : 'bg-card text-text opacity-70 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  {isGenerating ? 'Generating...' : 'AI Generate'}
                </button>
              </div>
              <textarea
                value={resumeData.summary}
                onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                placeholder="Write a professional summary or use AI to generate one"
                className="w-full h-32 px-4 py-2 bg-card text-text rounded-lg"
              />
            </div>

            {/* Skills */}
            <div className="glass p-6 rounded-xl">
              <h2 className="text-section mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {resumeData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-caption flex items-center gap-2"
                  >
                    {skill}
                    <button
                      onClick={() => {
                        const newSkills = resumeData.skills.filter((_, i) => i !== index);
                        setResumeData({ ...resumeData, skills: newSkills });
                      }}
                      className="hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add skill and press Enter"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    setResumeData({
                      ...resumeData,
                      skills: [...resumeData.skills, e.currentTarget.value]
                    });
                    e.currentTarget.value = '';
                  }
                }}
                className="w-full px-4 py-2 bg-card text-text rounded-lg"
              />
            </div>

            {/* Experience */}
            <div className="glass p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-section">Experience</h2>
                <button
                  onClick={addExperience}
                  className="px-4 py-2 bg-card hover:bg-card/80 text-text rounded-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-4">
                {resumeData.experience.map((exp, index) => (
                  <div key={index} className="p-4 bg-card/50 rounded-lg space-y-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          const newExp = resumeData.experience.filter((_, i) => i !== index);
                          setResumeData({ ...resumeData, experience: newExp });
                        }}
                        className="text-red-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={exp.title}
                      onChange={(e) => {
                        const newExp = [...resumeData.experience];
                        newExp[index].title = e.target.value;
                        setResumeData({ ...resumeData, experience: newExp });
                      }}
                      className="w-full px-3 py-2 bg-background text-text rounded"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Company"
                        value={exp.company}
                        onChange={(e) => {
                          const newExp = [...resumeData.experience];
                          newExp[index].company = e.target.value;
                          setResumeData({ ...resumeData, experience: newExp });
                        }}
                        className="w-full px-3 py-2 bg-background text-text rounded"
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g., Jan 2020 - Dec 2022)"
                        value={exp.duration}
                        onChange={(e) => {
                          const newExp = [...resumeData.experience];
                          newExp[index].duration = e.target.value;
                          setResumeData({ ...resumeData, experience: newExp });
                        }}
                        className="w-full px-3 py-2 bg-background text-text rounded"
                      />
                    </div>
                    <textarea
                      placeholder="Job description"
                      value={exp.description}
                      onChange={(e) => {
                        const newExp = [...resumeData.experience];
                        newExp[index].description = e.target.value;
                        setResumeData({ ...resumeData, experience: newExp });
                      }}
                      className="w-full px-3 py-2 bg-background text-text rounded h-24"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="glass p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-section">Education</h2>
                <button
                  onClick={addEducation}
                  className="px-4 py-2 bg-card hover:bg-card/80 text-text rounded-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-4">
                {resumeData.education.map((edu, index) => (
                  <div key={index} className="p-4 bg-card/50 rounded-lg space-y-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          const newEdu = resumeData.education.filter((_, i) => i !== index);
                          setResumeData({ ...resumeData, education: newEdu });
                        }}
                        className="text-red-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Degree"
                      value={edu.degree}
                      onChange={(e) => {
                        const newEdu = [...resumeData.education];
                        newEdu[index].degree = e.target.value;
                        setResumeData({ ...resumeData, education: newEdu });
                      }}
                      className="w-full px-3 py-2 bg-background text-text rounded"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Institution"
                        value={edu.institution}
                        onChange={(e) => {
                          const newEdu = [...resumeData.education];
                          newEdu[index].institution = e.target.value;
                          setResumeData({ ...resumeData, education: newEdu });
                        }}
                        className="w-full px-3 py-2 bg-background text-text rounded"
                      />
                      <input
                        type="text"
                        placeholder="Year"
                        value={edu.year}
                        onChange={(e) => {
                          const newEdu = [...resumeData.education];
                          newEdu[index].year = e.target.value;
                          setResumeData({ ...resumeData, education: newEdu });
                        }}
                        className="w-full px-3 py-2 bg-background text-text rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div className="glass p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-section">Projects</h2>
                <button
                  onClick={addProject}
                  className="px-4 py-2 bg-card hover:bg-card/80 text-text rounded-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-4">
                {resumeData.projects.map((proj, index) => (
                  <div key={index} className="p-4 bg-card/50 rounded-lg space-y-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          const newProj = resumeData.projects.filter((_, i) => i !== index);
                          setResumeData({ ...resumeData, projects: newProj });
                        }}
                        className="text-red-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Project Name"
                      value={proj.name}
                      onChange={(e) => {
                        const newProj = [...resumeData.projects];
                        newProj[index].name = e.target.value;
                        setResumeData({ ...resumeData, projects: newProj });
                      }}
                      className="w-full px-3 py-2 bg-background text-text rounded"
                    />
                    <textarea
                      placeholder="Project description"
                      value={proj.description}
                      onChange={(e) => {
                        const newProj = [...resumeData.projects];
                        newProj[index].description = e.target.value;
                        setResumeData({ ...resumeData, projects: newProj });
                      }}
                      className="w-full px-3 py-2 bg-background text-text rounded h-24"
                    />
                    <input
                      type="text"
                      placeholder="Technologies (comma separated)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          const newProj = [...resumeData.projects];
                          newProj[index].technologies = e.currentTarget.value.split(',').map(t => t.trim());
                          setResumeData({ ...resumeData, projects: newProj });
                          e.currentTarget.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 bg-background text-text rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview & Actions */}
          <div className="lg:col-span-1">
            <div className="glass p-6 rounded-xl sticky top-4">
              <h2 className="text-section mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={exportToPDF}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all"
                >
                  <Download className="w-5 h-5" />
                  Export to PDF
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('resumeData', JSON.stringify(resumeData));
                    alert('Resume saved!');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-card hover:bg-card/80 text-text rounded-lg transition-all"
                >
                  <Save className="w-5 h-5" />
                  Save Resume
                </button>
              </div>

              <div className="mt-6 p-4 bg-card/50 rounded-lg">
                <h3 className="text-section mb-2">Templates</h3>
                <div className="space-y-2">
                  {['modern', 'classic', 'creative'].map((template) => (
                    <button
                      key={template}
                      onClick={() => setSelectedTemplate(template)}
                      className={`w-full text-left px-3 py-2 rounded ${
                        selectedTemplate === template
                          ? 'bg-primary text-white'
                          : 'bg-card text-text hover:bg-card/80'
                      }`}
                    >
                      {template.charAt(0).toUpperCase() + template.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

