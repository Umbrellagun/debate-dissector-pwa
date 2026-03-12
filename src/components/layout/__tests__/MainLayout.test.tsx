import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainLayout } from '../MainLayout';

describe('MainLayout', () => {
  it('renders children', () => {
    render(
      <MainLayout>
        <div data-testid="content">Main Content</div>
      </MainLayout>
    );
    
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  describe('left sidebar', () => {
    it('renders left sidebar when provided', () => {
      render(
        <MainLayout
          leftSidebar={<div data-testid="left-sidebar">Left Sidebar</div>}
          showLeftSidebar={true}
        >
          <div>Content</div>
        </MainLayout>
      );
      
      expect(screen.getByTestId('left-sidebar')).toBeInTheDocument();
    });

    it('calls onLeftSidebarClose when backdrop clicked', () => {
      const onLeftSidebarClose = jest.fn();
      render(
        <MainLayout
          leftSidebar={<div>Left Sidebar</div>}
          showLeftSidebar={true}
          onLeftSidebarClose={onLeftSidebarClose}
        >
          <div>Content</div>
        </MainLayout>
      );
      
      // Find backdrop by its class - it has bg-black and is clickable
      const backdrop = document.querySelector('.bg-black.bg-opacity-50');
      expect(backdrop).toBeInTheDocument();
      
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onLeftSidebarClose).toHaveBeenCalledTimes(1);
      }
    });

    it('renders close button when onLeftSidebarClose provided', () => {
      render(
        <MainLayout
          leftSidebar={<div>Left Sidebar</div>}
          showLeftSidebar={true}
          onLeftSidebarClose={jest.fn()}
        >
          <div>Content</div>
        </MainLayout>
      );
      
      expect(screen.getByLabelText('Close navigation panel')).toBeInTheDocument();
    });

    it('calls onLeftSidebarClose when close button clicked', () => {
      const onLeftSidebarClose = jest.fn();
      render(
        <MainLayout
          leftSidebar={<div>Left Sidebar</div>}
          showLeftSidebar={true}
          onLeftSidebarClose={onLeftSidebarClose}
        >
          <div>Content</div>
        </MainLayout>
      );
      
      fireEvent.click(screen.getByLabelText('Close navigation panel'));
      expect(onLeftSidebarClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('right sidebar', () => {
    it('renders right sidebar when provided', () => {
      render(
        <MainLayout
          rightSidebar={<div data-testid="right-sidebar">Right Sidebar</div>}
          showRightSidebar={true}
          rightSidebarExpanded={true}
        >
          <div>Content</div>
        </MainLayout>
      );
      
      expect(screen.getByTestId('right-sidebar')).toBeInTheDocument();
    });

    it('calls onRightSidebarToggle when backdrop clicked', () => {
      const onRightSidebarToggle = jest.fn();
      render(
        <MainLayout
          rightSidebar={<div>Right Sidebar</div>}
          showRightSidebar={true}
          rightSidebarExpanded={true}
          onRightSidebarToggle={onRightSidebarToggle}
        >
          <div>Content</div>
        </MainLayout>
      );
      
      // Find backdrop - there should be one for the right sidebar
      const backdrops = document.querySelectorAll('.bg-black.bg-opacity-50');
      const backdrop = backdrops[backdrops.length - 1]; // Right sidebar backdrop
      
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onRightSidebarToggle).toHaveBeenCalledTimes(1);
      }
    });

    it('renders close button when onRightSidebarToggle provided', () => {
      render(
        <MainLayout
          rightSidebar={<div>Right Sidebar</div>}
          showRightSidebar={true}
          rightSidebarExpanded={true}
          onRightSidebarToggle={jest.fn()}
        >
          <div>Content</div>
        </MainLayout>
      );
      
      expect(screen.getByLabelText('Close annotation panel')).toBeInTheDocument();
    });

    it('calls onRightSidebarToggle when close button clicked', () => {
      const onRightSidebarToggle = jest.fn();
      render(
        <MainLayout
          rightSidebar={<div>Right Sidebar</div>}
          showRightSidebar={true}
          rightSidebarExpanded={true}
          onRightSidebarToggle={onRightSidebarToggle}
        >
          <div>Content</div>
        </MainLayout>
      );
      
      fireEvent.click(screen.getByLabelText('Close annotation panel'));
      expect(onRightSidebarToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('keyboard navigation', () => {
    it('closes left sidebar on Escape key', () => {
      const onLeftSidebarClose = jest.fn();
      render(
        <MainLayout
          leftSidebar={<div>Left Sidebar</div>}
          showLeftSidebar={true}
          onLeftSidebarClose={onLeftSidebarClose}
        >
          <div>Content</div>
        </MainLayout>
      );
      
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onLeftSidebarClose).toHaveBeenCalledTimes(1);
    });
  });
});
