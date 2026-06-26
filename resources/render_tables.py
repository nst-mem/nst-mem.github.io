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
        ['LaCT-NVS w/ L₂ w/ Mem Caching',  '20.25', '0.9135', '0.0688', '12.03', '0.4707'],
        ['Ours wo/ ℒ_mem',                  '28.23', '0.9639', '0.0251', '19.36', '0.6198'],
        ['Ours wo/ Mem Caching',            '29.24', '0.9673', '0.0232', '19.78', '0.6321'],
        ['Ours w/ Mem Caching',             '30.09', '0.9705', '0.0217', '20.79', '0.6537'],
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

    metrics = ['PSNR↑', 'SSIM↑', 'LPIPS↓', 'DISTS↓', 'mPSNR↑', 'mSSIM↑']

    methods = ['LVSM', 'LaCT-NVS', 'Token-Mem', 'Ours']

    # Data organized as [method][timestep_group][metric]
    # Timestep groups: 4, 30, 60
    # Source: sections/tables/mvhuman_net_experiments_arxiv_v5.tex (WACV)
    data_values = {
        'LVSM': [
            ['29.13', '0.9666', '0.0258', '0.1040', '19.55', '0.5790'],
            ['28.98', '0.9656', '0.0263', '0.1055', '19.40', '0.5707'],
            ['28.99', '0.9662', '0.0257', '0.1034', '19.34', '0.5670'],
        ],
        'LaCT-NVS': [
            ['30.69', '0.9741', '0.0196', '0.0822', '21.72', '0.7110'],
            ['30.38', '0.9708', '0.0216', '0.0885', '21.22', '0.6507'],
            ['25.85', '0.9500', '0.0360', '0.1236', '16.25', '0.5158'],
        ],
        'Token-Mem': [
            ['29.36', '0.9674', '0.0249', '0.1009', '20.40', '0.6409'],
            ['28.36', '0.9621', '0.0290', '0.1136', '19.14', '0.5624'],
            ['28.11', '0.9617', '0.0295', '0.1141', '18.84', '0.5505'],
        ],
        'Ours': [
            ['30.43', '0.9731', '0.0203', '0.0851', '21.46', '0.6971'],
            ['30.03', '0.9700', '0.0225', '0.0915', '20.86', '0.6434'],
            ['29.99', '0.9701', '0.0225', '0.0919', '20.71', '0.6286'],
        ],
    }

    # Cell ranking colors from the LaTeX source, organized as [method][timestep_group][metric]
    # W = WHITE, B = BEST, S = SECOND, T = THIRD
    W, B, S, T = WHITE, BEST_COLOR, SECOND_COLOR, THIRD_COLOR

    color_map = {
        'LVSM': [
            [W, W, W, W, W, W],
            [T, T, T, T, T, T],
            [S, S, S, S, S, S],
        ],
        'LaCT-NVS': [
            [B, B, B, B, B, B],
            [B, B, B, B, B, B],
            [W, W, W, W, W, W],
        ],
        'Token-Mem': [
            [T, T, T, T, T, T],
            [W, W, W, W, W, W],
            [T, T, T, T, T, T],
        ],
        'Ours': [
            [S, S, S, S, S, S],
            [S, S, S, S, S, S],
            [B, B, B, B, B, B],
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

    fig, ax = plt.subplots(figsize=(22, 3.5))
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
        # Spacer columns (col 7 and col 14 — 0-indexed, after 6-metric groups)
        if col in [7, 14]:
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
