import React from "react";
import { Mail, Phone, MapPin, Linkedin, Globe, Briefcase, GraduationCap, Award, Languages } from "lucide-react";

interface CVData {
  contact: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
  };
  profile: string;
  experience: Array<{
    company: string;
    role: string;
    period: string;
    location: string;
    achievements: string[];
  }>;
  skills: {
    technical: string[];
    soft: string[];
  };
  education: Array<{
    school: string;
    degree: string;
    year: string;
    location: string;
  }>;
  languages: string[];
}

interface Props {
  data: CVData;
  templateId: string;
  onChange?: (newData: CVData) => void;
}

export default function CVPreview({ data, templateId, onChange }: Props) {
  const isModern = templateId === "modern";
  const isClassic = templateId === "classic";
  const isCreative = templateId === "creative";
  const isMinimal = templateId === "minimal";

  const handleChange = (path: string, value: any) => {
    if (!onChange) return;
    const newData = { ...data };
    const keys = path.split('.');
    let current: any = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    onChange(newData);
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const newExp = [...data.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    handleChange('experience', newExp);
  };

  const updateAchievement = (expIndex: number, achIndex: number, value: string) => {
    const newExp = [...data.experience];
    const newAch = [...newExp[expIndex].achievements];
    newAch[achIndex] = value;
    newExp[expIndex] = { ...newExp[expIndex], achievements: newAch };
    handleChange('experience', newExp);
  };

  const updateEducation = (index: number, field: string, value: any) => {
    const newEdu = [...data.education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    handleChange('education', newEdu);
  };

  const inputClass = "bg-transparent border-none p-0 m-0 w-full focus:ring-1 focus:ring-primary/30 rounded outline-none hover:bg-slate-50 transition-colors";

  return (
    <div className={`w-full bg-white text-slate-900 shadow-2xl min-h-[1122px] p-12 font-sans cv-printable ${isMinimal ? 'font-light' : ''}`}>
      {/* Header */}
      <header className={`mb-10 ${isModern ? 'border-l-8 border-primary pl-6' : isCreative ? 'text-center bg-primary/5 p-8 rounded-3xl' : 'border-b pb-8'}`}>
        <input 
          className={`text-4xl font-black tracking-tighter uppercase mb-2 ${isCreative ? 'text-primary/90' : ''} ${inputClass}`}
          value={data.contact.name}
          onChange={(e) => handleChange('contact.name', e.target.value)}
        />
        <input 
          className={`text-xl font-bold ${isModern ? 'text-primary/90' : isCreative ? 'text-primary/80' : 'text-slate-500'} ${inputClass}`}
          value={data.contact.title}
          onChange={(e) => handleChange('contact.title', e.target.value)}
        />
        
        <div className={`mt-6 flex flex-wrap gap-4 text-xs font-medium text-slate-500 ${isCreative ? 'justify-center' : ''}`}>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> 
            <input className={inputClass} value={data.contact.email} onChange={(e) => handleChange('contact.email', e.target.value)} />
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> 
            <input className={inputClass} value={data.contact.phone} onChange={(e) => handleChange('contact.phone', e.target.value)} />
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> 
            <input className={inputClass} value={data.contact.location} onChange={(e) => handleChange('contact.location', e.target.value)} />
          </div>
          {data.contact.linkedin && (
            <div className="flex items-center gap-1.5">
              <Linkedin className="w-3.5 h-3.5" /> 
              <input className={inputClass} value={data.contact.linkedin} onChange={(e) => handleChange('contact.linkedin', e.target.value)} />
            </div>
          )}
        </div>
      </header>

      <div className={`grid gap-10 ${isModern || isClassic ? 'grid-cols-3' : 'grid-cols-1'}`}>
        {/* Main Column */}
        <div className={(isModern || isClassic) ? 'col-span-2 space-y-10' : 'space-y-10'}>
          {/* Profile */}
          <section>
            <h2 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${isModern ? 'text-primary/90' : isCreative ? 'text-primary/90' : 'text-slate-900'}`}>
              <Award className="w-4 h-4" /> Profil Professionnel
            </h2>
            <textarea 
              className={`text-sm leading-relaxed text-slate-600 italic w-full bg-transparent border-none resize-none focus:ring-1 focus:ring-primary/30 rounded outline-none hover:bg-slate-50 transition-colors`}
              rows={4}
              value={data.profile}
              onChange={(e) => handleChange('profile', e.target.value)}
            />
          </section>

          {/* Experience */}
          <section>
            <h2 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isModern ? 'text-primary/90' : isCreative ? 'text-primary/90' : 'text-slate-900'}`}>
              <Briefcase className="w-4 h-4" /> Expériences Professionnelles
            </h2>
            <div className="space-y-8">
              {data.experience.map((exp, i) => (
                <div key={i} className="relative pl-6 border-l border-slate-100">
                  <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full ${isModern ? 'bg-primary' : isCreative ? 'bg-primary' : 'bg-slate-300'}`} />
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <input 
                        className={`font-bold text-slate-900 ${inputClass}`}
                        value={exp.role}
                        onChange={(e) => updateExperience(i, 'role', e.target.value)}
                      />
                      <div className="flex items-center gap-1 text-sm font-medium text-slate-500">
                        <input className={inputClass} value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} />
                        <span>•</span>
                        <input className={inputClass} value={exp.location} onChange={(e) => updateExperience(i, 'location', e.target.value)} />
                      </div>
                    </div>
                    <input 
                      className={`text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded w-32 text-right ${inputClass}`}
                      value={exp.period}
                      onChange={(e) => updateExperience(i, 'period', e.target.value)}
                    />
                  </div>
                  <ul className="space-y-2">
                    {exp.achievements.map((ach, j) => (
                      <li key={j} className="text-xs text-slate-600 leading-relaxed flex gap-2">
                        <span className="text-primary">•</span> 
                        <textarea 
                          className={`w-full bg-transparent border-none resize-none focus:ring-1 focus:ring-primary/30 rounded outline-none hover:bg-slate-50 transition-colors`}
                          rows={1}
                          value={ach}
                          onChange={(e) => updateAchievement(i, j, e.target.value)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-10">
          {/* Skills */}
          <section>
            <h2 className={`text-sm font-black uppercase tracking-widest mb-4 ${isModern ? 'text-primary/90' : isCreative ? 'text-primary/90' : 'text-slate-900'}`}>
              Compétences
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Techniques</h3>
                <div className="flex flex-wrap gap-2">
                  {data.skills.technical.map((s, i) => (
                    <input 
                      key={i} 
                      className={`px-2 py-1 text-[10px] font-bold rounded w-auto inline-block ${isModern ? 'bg-primary/5 text-primary' : 'bg-slate-100 text-slate-600'} ${inputClass}`}
                      value={s}
                      onChange={(e) => {
                        const newTech = [...data.skills.technical];
                        newTech[i] = e.target.value;
                        handleChange('skills.technical', newTech);
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Soft Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {data.skills.soft.map((s, i) => (
                    <input 
                      key={i} 
                      className={`px-2 py-1 text-[10px] font-bold bg-slate-50 text-slate-500 rounded border border-slate-100 w-auto inline-block ${inputClass}`}
                      value={s}
                      onChange={(e) => {
                        const newSoft = [...data.skills.soft];
                        newSoft[i] = e.target.value;
                        handleChange('skills.soft', newSoft);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Education */}
          <section>
            <h2 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${isModern ? 'text-primary/90' : isCreative ? 'text-primary/90' : 'text-slate-900'}`}>
              <GraduationCap className="w-4 h-4" /> Éducation
            </h2>
            <div className="space-y-4">
              {data.education.map((edu, i) => (
                <div key={i}>
                  <input className={`text-xs font-bold text-slate-900 ${inputClass}`} value={edu.degree} onChange={(e) => updateEducation(i, 'degree', e.target.value)} />
                  <input className={`text-[10px] font-medium text-slate-500 ${inputClass}`} value={edu.school} onChange={(e) => updateEducation(i, 'school', e.target.value)} />
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <input className={inputClass} value={edu.year} onChange={(e) => updateEducation(i, 'year', e.target.value)} />
                    <span>•</span>
                    <input className={inputClass} value={edu.location} onChange={(e) => updateEducation(i, 'location', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Languages */}
          <section>
            <h2 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${isModern ? 'text-primary/90' : isCreative ? 'text-primary/90' : 'text-slate-900'}`}>
              <Languages className="w-4 h-4" /> Langues
            </h2>
            <div className="flex flex-wrap gap-3">
              {data.languages.map((l, i) => (
                <input 
                  key={i} 
                  className={`text-xs font-bold text-slate-600 w-20 ${inputClass}`} 
                  value={l} 
                  onChange={(e) => {
                    const newLang = [...data.languages];
                    newLang[i] = e.target.value;
                    handleChange('languages', newLang);
                  }}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-20 pt-8 border-t border-slate-100 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
          Généré par Alberta Connect IA • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
