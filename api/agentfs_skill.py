"""
AgentFS — Skill 封装与项目章程生成

职责：
- 为项目生成 Skill 文件（让 Agent 知道自己的角色、工作流程、输出规范）
- 管理项目章程（项目目标、里程碑、成功标准）
- Skill 写入各参与员工的 profiles/skills/ 目录
"""
import os
import time
from pathlib import Path
from typing import Optional

from api.config import HERMES_HOME


def _profile_skills_dir(profile_name: str) -> Path:
    return Path(HERMES_HOME) / "profiles" / profile_name / "skills"


def generate_project_skill(project_id: str) -> dict:
    """
    为项目生成 Skill 文件，写入所有参与 Agent 的 skills 目录。
    返回 {skill_name, files_written: [path, ...]}
    """
    from api.models import load_projects
    from api.employees import list_employees

    projects = load_projects()
    proj = next((p for p in projects if p["project_id"] == project_id), None)
    if not proj:
        raise ValueError(f"Project {project_id} not found")

    emps = {e["id"]: e for e in list_employees()}
    skill_name = f"project_{project_id}"
    agents = proj.get("agents", [])

    files_written = []
    for agent_cfg in agents:
        emp = emps.get(agent_cfg["emp_id"])
        if not emp:
            continue
        profile_name = emp.get("profile_name")
        if not profile_name:
            continue

        content = _render_skill(proj, emp, agent_cfg, agents, emps)
        skills_dir = _profile_skills_dir(profile_name)
        skills_dir.mkdir(parents=True, exist_ok=True)
        skill_file = skills_dir / f"{skill_name}.md"
        skill_file.write_text(content, encoding="utf-8")
        files_written.append(str(skill_file))

    # 更新 projects.json 中的 skill_ref
    proj["skill_ref"] = skill_name
    proj["updated_at"] = time.time()
    from api.models import save_projects
    save_projects(projects)

    return {"skill_name": skill_name, "files_written": files_written}


def _render_skill(proj: dict, emp: dict, agent_cfg: dict,
                  all_agents: list, emps: dict) -> str:
    """渲染单个 Agent 的 Skill Markdown 内容。"""
    proj_name = proj.get("name", "未命名项目")
    proj_desc = proj.get("description", "")
    role = agent_cfg.get("role", emp.get("description", "协作Agent"))
    emp_name = emp.get("name", "Agent")
    perms = agent_cfg.get("permissions", {})
    perm_desc = "读写" if perms.get("write") else ("只读" if perms.get("read") else "受限")

    # 其他参与 Agent
    other_agents = [
        f"- {emps[a['emp_id']]['name']}（{a['role']}）"
        for a in all_agents
        if a["emp_id"] != emp["id"] and a["emp_id"] in emps
    ]
    other_agents_str = "\n".join(other_agents) if other_agents else "- 暂无其他协作Agent"

    charter = proj.get("charter", "")
    charter_section = f"\n## 项目章程\n\n{charter}\n" if charter else ""

    return f"""# 项目技能：{proj_name}

> 本文件由系统自动生成，描述你在项目中的角色和工作方式。

## 你的身份

你是 **{emp_name}**，在本项目中担任 **{role}**。
文件访问权限：{perm_desc}

## 项目概述

**项目名称**：{proj_name}
**项目描述**：{proj_desc or "（暂无描述）"}
{charter_section}
## 协作成员

{other_agents_str}

## 工作流程

1. 接收任务后，先查阅项目文件了解上下文
2. 完成工作后，将输出文件保存到你的工作区
3. 在 `project_log.md` 中记录本次完成的工作内容
4. 通知用户或下一个负责的 Agent

## 输出规范

- 所有输出文件保存到你的工作区目录
- 完成每项任务后，在工作区根目录的 `project_log.md` 追加一条记录：
  ```
  [{time.strftime('%Y-%m-%d %H:%M')}] {emp_name}：完成了 [任务描述]，输出：[文件路径]
  ```
- 如需其他 Agent 接手，在 project_log.md 中注明"待 [Agent名称] 处理"

## 权限说明

- 你可以{perm_desc}本项目的共享文件
- 如需访问其他 Agent 的私有文件，系统会自动发起权限申请，等待用户审批
"""


def get_project_skill(project_id: str) -> Optional[str]:
    """获取项目 Skill 内容（取第一个参与 Agent 的版本）。"""
    from api.models import load_projects
    from api.employees import list_employees

    projects = load_projects()
    proj = next((p for p in projects if p["project_id"] == project_id), None)
    if not proj:
        return None

    emps = {e["id"]: e for e in list_employees()}
    skill_name = f"project_{project_id}"

    for agent_cfg in proj.get("agents", []):
        emp = emps.get(agent_cfg["emp_id"])
        if not emp or not emp.get("profile_name"):
            continue
        skill_file = _profile_skills_dir(emp["profile_name"]) / f"{skill_name}.md"
        if skill_file.exists():
            return skill_file.read_text(encoding="utf-8")
    return None


def update_project_charter(project_id: str, charter: str) -> bool:
    """更新项目章程，并重新生成 Skill 文件。"""
    from api.models import load_projects, save_projects

    projects = load_projects()
    proj = next((p for p in projects if p["project_id"] == project_id), None)
    if not proj:
        return False
    proj["charter"] = charter
    proj["updated_at"] = time.time()
    save_projects(projects)

    # 重新生成 Skill（包含最新章程）
    if proj.get("agents"):
        try:
            generate_project_skill(project_id)
        except Exception:
            pass
    return True
