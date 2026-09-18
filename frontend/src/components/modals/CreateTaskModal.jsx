import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { createTask, clearTaskError } from "../../features/taskSlice";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = [
    { value: "todo",        label: "To Do"       },
    { value: "in_progress", label: "In Progress" },
    { value: "in_review",   label: "In Review"   },
    { value: "completed",   label: "Completed"   },
];

const CreateTaskModal = ({ isOpen, onClose, workspaceId, projectId, defaultStatus = "todo" }) => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector((s) => s.task);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: { priority: "medium", status: defaultStatus },
    });

    useEffect(() => {
        if (!isOpen) { reset({ priority: "medium", status: defaultStatus }); dispatch(clearTaskError()); }
    }, [isOpen, defaultStatus, reset, dispatch]);

    const onSubmit = async (formData) => {
        const result = await dispatch(createTask({ workspaceId, projectId, ...formData }));
        if (result.meta.requestStatus === "fulfilled") { onClose(); reset(); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
             onClick={onClose}>
            <div className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-md shadow-2xl"
                 onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        <h2 className="text-base font-semibold text-foreground">New Task</h2>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-2.5">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Title <span className="text-destructive">*</span>
                        </label>
                        <input type="text" placeholder="e.g. Write API documentation"
                            {...register("title", { required: "Task title is required" })}
                            className={`w-full bg-muted text-foreground placeholder-muted-foreground rounded-lg px-3.5 py-2.5 text-sm border outline-none transition focus:ring-2 focus:ring-ring ${
                                errors.title ? "border-destructive/60" : "border-border focus:border-ring"
                            }`}
                        />
                        {errors.title && <p className="mt-1.5 text-xs text-destructive">{errors.title.message}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                        <textarea rows={2} placeholder="Optional details..."
                            {...register("description")}
                            className="w-full bg-muted text-foreground placeholder-muted-foreground rounded-lg px-3.5 py-2.5 text-sm border border-border outline-none transition focus:ring-2 focus:ring-ring focus:border-ring resize-none"
                        />
                    </div>

                    {/* Priority + Status */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Priority</label>
                            <select {...register("priority")}
                                className="w-full bg-muted text-foreground rounded-lg px-3 py-2.5 text-sm border border-border outline-none transition focus:ring-2 focus:ring-ring capitalize cursor-pointer">
                                {PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                            <select {...register("status")}
                                className="w-full bg-muted text-foreground rounded-lg px-3 py-2.5 text-sm border border-border outline-none transition focus:ring-2 focus:ring-ring cursor-pointer">
                                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Due Date <span className="text-destructive">*</span>
                        </label>
                        <input type="date"
                            {...register("dueDate", { required: "Due date is required" })}
                            className={`w-full bg-muted text-foreground rounded-lg px-3.5 py-2.5 text-sm border outline-none transition focus:ring-2 focus:ring-ring [color-scheme:dark] cursor-pointer ${
                                errors.dueDate ? "border-destructive/60" : "border-border focus:border-ring"
                            }`}
                        />
                        {errors.dueDate && <p className="mt-1.5 text-xs text-destructive">{errors.dueDate.message}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-lg px-5 py-2 text-sm transition-colors">
                            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Adding...</> : "Add Task"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;
