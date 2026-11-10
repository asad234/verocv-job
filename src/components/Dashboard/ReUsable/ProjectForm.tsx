import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Project Schema with proper date validation
const ProjectSchema = z.object({
  id: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date().optional().nullable(),
  isOngoing: z.boolean().default(false),
  description: z.string().min(1, "Description is required"),
  skills: z.array(z.string().min(1, "Skill cannot be empty")).default([]),
  company: z.string().optional(),
  location: z.string().optional(),
  link: z.string().url("Invalid URL").optional().or(z.literal('')),
}).refine(data => !data.isOngoing || !data.endDate, {
  message: "End date should be empty when project is ongoing",
  path: ["endDate"]
});

// Type inferred from Zod schema
type Project = z.infer<typeof ProjectSchema>;

interface ProjectFormProps {
  projects: Project[];
  onSave: (projects: Project[]) => void;
  onCancel: () => void;
  projectToEdit?: Project;
}

const ProjectForm: React.FC<ProjectFormProps> = ({
  projects,
  onSave,
  onCancel,
  projectToEdit
}) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<Project>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: projectToEdit || {
      role: '',
      startDate: new Date(),
      endDate: null,
      isOngoing: false,
      description: '',
      skills: [],
      company: '',
      location: '',
      link: '',
    },
  });

  const [newSkill, setNewSkill] = useState('');

  const onSubmit = (data: Project) => {
    let updatedProjects: Project[];

    if (projectToEdit?.id) {
      // Update existing project
      updatedProjects = projects.map(project =>
        project.id === projectToEdit.id ? { ...data, id: projectToEdit.id } : project
      );
    } else {
      // Add new project
      updatedProjects = [...projects, { ...data, id: Date.now().toString() }];
    }

    onSave(updatedProjects);
    onCancel();
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const skill = newSkill.trim();
      if (skill) {
        setValue('skills', [...watch('skills'), skill]);
        setNewSkill('');
      }
    }
  };

  const handleRemoveSkill = (index: number) => {
    setValue('skills', watch('skills').filter((_, i) => i !== index));
  };

  const handleDelete = () => {
    if (projectToEdit?.id) {
      onSave(projects.filter(p => p.id !== projectToEdit.id));
      onCancel();
    }
  };

  const isOngoing = watch('isOngoing');


  const rawSkills = watch('skills') as string | string[];


  // Ensure we always have a string array
  const skills: string[] = Array.isArray(rawSkills)
    ? rawSkills
    : typeof rawSkills === 'string'
      ? rawSkills.split(',').map(s => s.trim()).filter(Boolean)
      : [];


  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {projectToEdit ? 'Edit Project' : 'Add New Project'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <input
            {...register('role')}
            className={`w-full px-3 py-2 border rounded-md ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Software Developer"
          />
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <DatePicker
                  selected={field.value}
                  onChange={field.onChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`}
                  dateFormat="dd MMMM yyyy"
                  placeholderText="Select start date"
                />
              )}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
            )}
          </div>

          {!isOngoing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <Controller
                control={control}
                name="endDate"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={field.onChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`}
                    dateFormat="dd MMMM yyyy"
                    placeholderText="Select end date"
                    isClearable
                  />
                )}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Ongoing Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isOngoing"
            {...register('isOngoing')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isOngoing" className="ml-2 block text-sm text-gray-700">
            Currently working here
          </label>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Describe your role and responsibilities"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Skills
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(index)}
                  className="ml-2 text-blue-800 hover:text-blue-900"
                >
                  <Icon icon="mdi:close" className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={handleAddSkill}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Add skill and press Enter"
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <input
            {...register('company')}
            className={`w-full px-3 py-2 border rounded-md ${errors.company ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Company Name"
          />
          {errors.company && (
            <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            {...register('location')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="City, Country"
          />
        </div>

        {/* Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project URL
          </label>
          <input
            {...register('link')}
            className={`w-full px-3 py-2 border rounded-md ${errors.link ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="https://example.com"
          />
          {errors.link && (
            <p className="mt-1 text-sm text-red-600">{errors.link.message}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          {projectToEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {projectToEdit ? 'Update' : 'Add'} Project
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
