#!/usr/bin/env python3
"""Render LaTeX tables from the paper as high-quality PNG images.

Uses matplotlib to create publication-style tables matching the paper's
formatting (booktabs style, colored cells for rankings).
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from matplotlib.font_manager import FontProperties
import numpy as np
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Color definitions matching LaTeX \definecolor
BEST_COLOR   = '#FFCCCC'
SECOND_COLOR = '#FFEDCC'
THIRD_COLOR  = '#FFFFCC'
WHITE        = '#FFFFFF'
HEADER_BG    = '#F5F5F5'


def render_ablation_table():
    """Render the ablation study table (Table 2)."""

    columns = ['Method', 'PSNR↑', 'SSIM↑', 'LPIPS↓', 'mPSNR↑', 'mSSIM↑']

    data = [
        ['LaCT-NVS Baseline',              '22.32', '0.9275', '0.0616', '13.49', '0.4942'],
        ['LaCT-NVS w/ L₂',                 '27.77', '0.9594', '0.0275', '19.08', '0.6189'],
        ['LaCT-NVS w/ L₂ w/ Mem Caching',  '19.91', '0.9096', '0.0746', '11.63', '0.4509'],
        ['Ours wo/ ℒ_mem',                  '28.23', '0.9639', '0.0251', '19.36', '0.6198'],
        ['Ours wo/ Mem Caching',            '29.24', '0.9673', '0.0232', '19.78', '0.6321'],
        ['Ours w/ Mem Caching',             '30.09', '0.9708', '0.0212', '20.82', '0.6604'],
    ]

    # Cell colors: None = white, 'best', 'second', 'third'
    cell_colors = [
        [WHITE]*6,
        [WHITE]*6,
        [WHITE]*6,
        [WHITE, THIRD_COLOR, THIRD_COLOR, THIRD_COLOR, THIRD_COLOR, THIRD_COLOR],
        [WHITE, SECOND_COLOR, SECOND_COLOR, SECOND_COLOR, SECOND_COLOR, SECOND_COLOR],
        [WHITE, BEST_COLOR, BEST_COLOR, BEST_COLOR, BEST_COLOR, BEST_COLOR],
    ]

    fig, ax = plt.subplots(figsize=(12, 3.5))
    ax.axis('off')
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)

    # Title
    ax.text(0.5, 0.98, 'Ablation Study (over 60 timesteps)', fontsize=14, fontweight='bold',
            ha='center', va='top', transform=ax.transAxes)

    table = ax.table(
        cellText=data,
        colLabels=columns,
        cellColours=cell_colors,
        colColours=[HEADER_BG]*6,
        cellLoc='center',
        loc='center',
        bbox=[0.02, 0.05, 0.96, 0.85]
    )

    table.auto_set_font_size(False)
    table.set_fontsize(11)

    # Style cells — booktabs via per-cell borders (two-pass to preserve face colors)
    n_data_rows = len(data)
    for (row, col), cell in table.get_celld().items():
        # First: make all edges invisible (white)
        cell.set_edgecolor('white')
        cell.set_linewidth(0)
        if row == 0:  # Header row
            cell.set_text_props(fontweight='bold', fontsize=11)
            cell.set_height(0.15)
        else:
            cell.set_height(0.13)
        if col == 0:  # Method names left-aligned and wider
            cell.set_text_props(ha='left')
            cell._loc = 'left'
            cell.set_width(0.25)

    # Second pass: add booktabs rules by drawing lines at cell boundaries
    # Get table bbox in axes coordinates
    table_bbox = table.get_window_extent(fig.canvas.get_renderer())
    inv_transform = ax.transAxes.inverted()

    # Collect header and last-row cell positions to draw rules
    header_cells = [(col, cell) for (row, col), cell in table.get_celld().items() if row == 0]
    last_row_cells = [(col, cell) for (row, col), cell in table.get_celld().items() if row == n_data_rows]

    if header_cells:
        # Get extent from first header cell
        sample = header_cells[0][1]
        bbox = sample.get_window_extent(fig.canvas.get_renderer())
        top_y = inv_transform.transform((0, bbox.y1))[1]
        bot_y = inv_transform.transform((0, bbox.y0))[1]
        x_left = inv_transform.transform((table_bbox.x0, 0))[0]
        x_right = inv_transform.transform((table_bbox.x1, 0))[0]
        # Top rule
        ax.plot([x_left, x_right], [top_y, top_y], color='black', linewidth=1.5, transform=ax.transAxes, clip_on=False)
        # Header bottom rule (midrule)
        ax.plot([x_left, x_right], [bot_y, bot_y], color='black', linewidth=0.8, transform=ax.transAxes, clip_on=False)

    if last_row_cells:
        sample = last_row_cells[0][1]
        bbox = sample.get_window_extent(fig.canvas.get_renderer())
        bot_y = inv_transform.transform((0, bbox.y0))[1]
        x_left = inv_transform.transform((table_bbox.x0, 0))[0]
        x_right = inv_transform.transform((table_bbox.x1, 0))[0]
        # Bottom rule
        ax.plot([x_left, x_right], [bot_y, bot_y], color='black', linewidth=1.5, transform=ax.transAxes, clip_on=False)

    out_path = os.path.join(SCRIPT_DIR, 'ablations_exp.png')
    fig.savefig(out_path, dpi=200, bbox_inches='tight', pad_inches=0.15, facecolor='white')
    plt.close(fig)
    print(f'Saved: {out_path}')
    return out_path


def render_mvhuman_table():
    """Render the MVHumanNet experiments table (Table 1)."""

    metrics = ['PSNR↑', 'SSIM↑', 'LPIPS↓', 'mPSNR↑', 'mSSIM↑']

    methods = ['Full-Attn', 'Token-Mem', 'LaCT-NVS', 'Ours']

    # Data organized as [method][timestep_group][metric]
    # Timestep groups: 4, 30, 60
    data_values = {
        'Full-Attn': [
            ['28.72', '0.9659', '0.0256', '19.49', '0.6152'],
            ['28.49', '0.9640', '0.0271', '19.08', '0.5715'],
            ['28.47', '0.9639', '0.0272', '19.05', '0.5694'],
        ],
        'Token-Mem': [
            ['28.75', '0.9638', '0.0277', '19.68', '0.5955'],
            ['28.66', '0.9634', '0.0284', '19.42', '0.5706'],
            ['28.65', '0.9634', '0.0286', '19.37', '0.5674'],
        ],
        'LaCT-NVS': [
            ['30.84', '0.9746', '0.0180', '22.06', '0.7348'],
            ['25.67', '0.9478', '0.0369', '16.94', '0.5794'],
            ['22.32', '0.9275', '0.0616', '13.49', '0.4942'],
        ],
        'Ours': [
            ['30.71', '0.9745', '0.0186', '21.78', '0.7300'],
            ['30.21', '0.9712', '0.0210', '20.98', '0.6646'],
            ['30.09', '0.9708', '0.0212', '20.82', '0.6604'],
        ],
    }

    # Cell ranking colors from the LaTeX source, organized as [method][timestep_group][metric]
    # W = WHITE, B = BEST, S = SECOND, T = THIRD
    W, B, S, T = WHITE, BEST_COLOR, SECOND_COLOR, THIRD_COLOR

    color_map = {
        'Full-Attn': [
            [W, T, T, W, T],
            [T, S, S, T, T],
            [T, S, S, T, S],
        ],
        'Token-Mem': [
            [T, W, W, T, W],
            [S, T, T, S, W],
            [S, T, T, S, T],
        ],
        'LaCT-NVS': [
            [B, B, B, B, B],
            [W, W, W, W, S],
            [W, W, W, W, W],
        ],
        'Ours': [
            [S, S, S, S, S],
            [B, B, B, B, B],
            [B, B, B, B, B],
        ],
    }

    # Build flat table data
    # Columns: Method | 5 metrics (T=4) | spacer | 5 metrics (T=30) | spacer | 5 metrics (T=60)
    columns = ['Method'] + metrics + [''] + metrics + [''] + metrics
    n_cols = len(columns)

    table_data = []
    table_colors = []

    for method in methods:
        row = [method]
        row_colors = [WHITE]
        for t_idx in range(3):
            if t_idx > 0:
                row.append('')
                row_colors.append(WHITE)
            row.extend(data_values[method][t_idx])
            row_colors.extend(color_map[method][t_idx])
        table_data.append(row)
        table_colors.append(row_colors)

    fig, ax = plt.subplots(figsize=(18, 3.5))
    ax.axis('off')
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)

    # Title
    ax.text(0.5, 1.05, 'Quantitative Comparison', fontsize=14, fontweight='bold',
            ha='center', va='top', transform=ax.transAxes)

    table = ax.table(
        cellText=table_data,
        colLabels=columns,
        cellColours=table_colors,
        colColours=[HEADER_BG]*n_cols,
        cellLoc='center',
        loc='center',
        bbox=[0.01, 0.05, 0.98, 0.80]
    )

    table.auto_set_font_size(False)
    table.set_fontsize(10)

    # Style cells — two-pass to preserve face colors
    n_data_rows = len(table_data)
    for (row, col), cell in table.get_celld().items():
        cell.set_edgecolor('white')
        cell.set_linewidth(0)
        # Spacer columns (col 6 and col 12 — 0-indexed)
        if col in [6, 12]:
            cell.set_width(0.005)
            cell.set_facecolor(WHITE)
            cell.set_text_props(text='')
        if row == 0:  # Header row
            cell.set_text_props(fontweight='bold', fontsize=9)
            cell.set_height(0.18)
        else:
            cell.set_height(0.16)
        if col == 0:  # Method names left-aligned and wider
            cell.set_text_props(ha='left')
            cell._loc = 'left'
            cell.set_width(0.08)

    # Sub-headers for timestep groups
    group_positions = [
        (0.15, '4 Timesteps'),
        (0.47, '30 Timesteps'),
        (0.80, '60 Timesteps'),
    ]
    for x, label in group_positions:
        ax.text(x, 0.90, label, fontsize=11, fontweight='bold',
                ha='center', va='center', transform=ax.transAxes)

    # Second pass: draw booktabs rules at actual cell boundaries
    table_bbox = table.get_window_extent(fig.canvas.get_renderer())
    inv_transform = ax.transAxes.inverted()

    header_cells = [(col, cell) for (row, col), cell in table.get_celld().items() if row == 0]
    last_row_cells = [(col, cell) for (row, col), cell in table.get_celld().items() if row == n_data_rows]

    if header_cells:
        sample = header_cells[0][1]
        bbox = sample.get_window_extent(fig.canvas.get_renderer())
        top_y = inv_transform.transform((0, bbox.y1))[1]
        bot_y = inv_transform.transform((0, bbox.y0))[1]
        x_left = inv_transform.transform((table_bbox.x0, 0))[0]
        x_right = inv_transform.transform((table_bbox.x1, 0))[0]
        ax.plot([x_left, x_right], [top_y, top_y], color='black', linewidth=1.5, transform=ax.transAxes, clip_on=False)
        ax.plot([x_left, x_right], [bot_y, bot_y], color='black', linewidth=0.8, transform=ax.transAxes, clip_on=False)

    if last_row_cells:
        sample = last_row_cells[0][1]
        bbox = sample.get_window_extent(fig.canvas.get_renderer())
        bot_y = inv_transform.transform((0, bbox.y0))[1]
        x_left = inv_transform.transform((table_bbox.x0, 0))[0]
        x_right = inv_transform.transform((table_bbox.x1, 0))[0]
        ax.plot([x_left, x_right], [bot_y, bot_y], color='black', linewidth=1.5, transform=ax.transAxes, clip_on=False)

    out_path = os.path.join(SCRIPT_DIR, 'mvhuman_net_experiments.png')
    fig.savefig(out_path, dpi=200, bbox_inches='tight', pad_inches=0.15, facecolor='white')
    plt.close(fig)
    print(f'Saved: {out_path}')
    return out_path


if __name__ == '__main__':
    render_ablation_table()
    render_mvhuman_table()
    print('Done — both tables rendered.')
