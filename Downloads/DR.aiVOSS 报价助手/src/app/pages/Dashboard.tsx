import React, { useState } from "react";
import {
  Search,
  Plus,
  Filter,
  Bell,
  Factory,
  Users,
  Tag,
  Calendar,
  MoreVertical,
  Briefcase,
} from "lucide-react";
import {
  Input,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Select,
  Card,
  Badge,
} from "../components/ui/shared";
import { ProjectCard } from "../components/project/ProjectCard";
import { useSimpleRouter } from "../router";

// Define Project Interface
export interface Project {
  id: string;
  projectName: string;
  projectCode: string; // AS/AC 编号
  customerName: string;
  customerCode: string;
  factoryId: string; // v1.5 新增
  annualVolume: number;
  status: "draft" | "in-progress" | "completed" | "on-hold";
  owner: string;
  remarks?: string;
  targetMargin?: number;
  createdDate: string;
}

// Mock Factories
const FACTORIES = [
  { id: "SH-01", name: "上海工厂 (Shanghai)" },
  { id: "DE-01", name: "德国工厂 (Germany)" },
  { id: "MX-01", name: "墨西哥工厂 (Mexico)" },
];

// Mock Data
const initialProjects: Project[] = [
  {
    id: "1",
    projectCode: "AS-2026-001",
    projectName: "Brake Line Assembly V2",
    customerName: "Tesla Inc.",
    customerCode: "CUST-TSL-001",
    factoryId: "SH-01",
    annualVolume: 50000,
    status: "in-progress",
    owner: "Alice",
    targetMargin: 15.5,
    createdDate: "2026-02-12",
    remarks: "Key project for Q1",
  },
  {
    id: "2",
    projectCode: "AS-2026-002",
    projectName: "Cooling System Connector",
    customerName: "BMW Group",
    customerCode: "CUST-BMW-009",
    factoryId: "DE-01",
    annualVolume: 120000,
    status: "completed",
    owner: "David",
    targetMargin: 12.0,
    createdDate: "2026-01-20",
  },
  {
    id: "3",
    projectCode: "AS-2026-003",
    projectName: "Fuel Rail Adaptor",
    customerName: "Ford Motor",
    customerCode: "CUST-FRD-022",
    factoryId: "MX-01",
    annualVolume: 30000,
    status: "draft",
    owner: "Frank",
    targetMargin: 18.0,
    createdDate: "2026-02-14",
  },
];

export default function Dashboard() {
  const { navigate } = useSimpleRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<string>("all");
  const [projects, setProjects] =
    useState<Project[]>(initialProjects);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New Project Form State
  const [newProject, setNewProject] = useState<
    Partial<Project>
  >({
    projectName: "",
    projectCode: `AS-2026-00${initialProjects.length + 1}`,
    customerName: "",
    customerCode: "",
    factoryId: "",
    annualVolume: 0,
    status: "draft",
    owner: "CurrentUser",
    remarks: "",
    targetMargin: 15.0,
  });

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.projectName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      project.customerName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      project.projectCode
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const isValid =
    newProject.projectName &&
    newProject.customerName &&
    newProject.factoryId;

  const handleCreateProject = () => {
    if (!isValid) return;

    const projectId = (projects.length + 1).toString();
    const project: Project = {
      id: projectId,
      projectCode:
        newProject.projectCode || `AS-2026-00${projectId}`,
      projectName: newProject.projectName || "",
      customerName: newProject.customerName || "",
      customerCode: newProject.customerCode || "",
      factoryId: newProject.factoryId || "",
      annualVolume: Number(newProject.annualVolume) || 0,
      status: "draft",
      owner: "CurrentUser",
      createdDate: new Date().toISOString().split("T")[0],
      remarks: newProject.remarks,
      targetMargin: newProject.targetMargin,
    };

    setProjects([project, ...projects]);
    setIsDialogOpen(false);

    // Reset Form
    setNewProject({
      projectName: "",
      projectCode: `AS-2026-00${projects.length + 2}`,
      customerName: "",
      customerCode: "",
      factoryId: "",
      annualVolume: 0,
      status: "draft",
      owner: "CurrentUser",
      remarks: "",
      targetMargin: 15.0,
    });

    // Navigate to new project
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="flex-1 h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Top Nav */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <Briefcase className="h-6 w-6" />
          <span>智能报价助手</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-950"></span>
          </button>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Si Manna
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                价值管理经理
              </p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1652471943570-f3590a4e52ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbiUyMGJ1c2luZXNzfGVufDF8fHx8MTc3MDk0ODU0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-800"
              alt="User"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                项目仪表盘
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                管理您的所有报价项目和状态。
              </p>
            </div>
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus size={16} />
              新建项目
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索项目名称、客户或 AS 编码..."
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={16} className="text-slate-500" />
              <div className="w-full sm:w-40">
                <Select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                >
                  <option value="all">所有状态</option>
                  <option value="draft">草稿</option>
                  <option value="in-progress">进行中</option>
                  <option value="completed">已完成</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Project Grid */}
          {filteredProjects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  {...project}
                  asCode={project.projectCode}
                  clientName={project.customerName}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-lg border border-dashed border-slate-300 dark:bg-slate-950 dark:border-slate-800">
              <div className="mx-auto h-12 w-12 text-slate-400 mb-4 flex items-center justify-center bg-slate-50 rounded-full">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">
                未找到项目
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                尝试调整搜索或筛选条件。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
        <DialogContent
          className="sm:max-w-[600px]"
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        >
          <DialogHeader>
            <DialogTitle>创建新项目</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Row 1: Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="projectName">
                  项目名称{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="projectName"
                  value={newProject.projectName}
                  placeholder="例如: Fuel Rail System"
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      projectName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="projectCode">
                  AS/AC 编号{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="projectCode"
                  value={newProject.projectCode}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      projectCode: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Row 2: Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customerName">
                  客户名称{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customerName"
                  value={newProject.customerName}
                  placeholder="例如: Tesla"
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      customerName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customerCode">客户编号</Label>
                <Input
                  id="customerCode"
                  value={newProject.customerCode}
                  placeholder="例如: CUST-001"
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      customerCode: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Row 3: Factory & Volume */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="factoryId">
                  所属工厂{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="factoryId"
                  value={newProject.factoryId}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      factoryId: e.target.value,
                    })
                  }
                >
                  <option value="">选择工厂...</option>
                  {FACTORIES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="annualVolume">
                  年产量 (Annual Volume){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="annualVolume"
                    type="number"
                    value={newProject.annualVolume}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        annualVolume:
                          parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">
                    pcs/yr
                  </span>
                </div>
              </div>
            </div>

            {/* Row 4: Additional Info */}
            <div className="grid gap-2">
              <Label htmlFor="remarks">备注 (Remarks)</Label>
              <Input
                id="remarks"
                value={newProject.remarks}
                placeholder="可选备注..."
                onChange={(e) =>
                  setNewProject({
                    ...newProject,
                    remarks: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateProject}
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isValid}
            >
              {isValid ? "创建项目" : "请完善信息"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}