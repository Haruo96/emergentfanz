#!/usr/bin/env python3
"""
Backend API Testing for Content Monetization Platform
Tests the core API endpoints for content discovery, creators, and individual content access.
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, List, Any

# Backend URL from frontend environment
BACKEND_URL = "https://social-vault-1.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.sample_content_ids = []
        self.sample_creator_ids = []
        
    def log_test(self, test_name: str, success: bool, details: str, response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def test_api_root(self):
        """Test the API root endpoint"""
        try:
            response = self.session.get(f"{BACKEND_URL}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("API Root Endpoint", True, f"API is accessible. Message: {data['message']}")
                    return True
                else:
                    self.log_test("API Root Endpoint", False, "API accessible but unexpected response format", data)
                    return False
            else:
                self.log_test("API Root Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("API Root Endpoint", False, f"Connection error: {str(e)}")
            return False

    def test_content_discovery(self):
        """Test GET /api/content endpoint with various scenarios"""
        
        # Test 1: Basic content retrieval
        try:
            response = self.session.get(f"{BACKEND_URL}/content")
            if response.status_code == 200:
                content_list = response.json()
                
                if isinstance(content_list, list) and len(content_list) > 0:
                    self.log_test("Content Discovery - Basic Retrieval", True, 
                                f"Retrieved {len(content_list)} content items")
                    
                    # Store sample content IDs for later tests
                    self.sample_content_ids = [item['id'] for item in content_list[:3]]
                    
                    # Test content structure
                    first_content = content_list[0]
                    required_fields = ['id', 'creator_id', 'creator_username', 'title', 'content_type', 
                                     'is_free', 'media_urls', 'is_locked', 'created_at']
                    
                    missing_fields = [field for field in required_fields if field not in first_content]
                    if not missing_fields:
                        self.log_test("Content Structure Validation", True, 
                                    "All required fields present in content response")
                    else:
                        self.log_test("Content Structure Validation", False, 
                                    f"Missing fields: {missing_fields}", first_content)
                    
                    # Test access control logic
                    free_content = [item for item in content_list if item['is_free']]
                    locked_content = [item for item in content_list if not item['is_free']]
                    
                    if free_content:
                        free_item = free_content[0]
                        if not free_item['is_locked'] and free_item['media_urls']:
                            self.log_test("Free Content Access Control", True, 
                                        "Free content shows media URLs and is not locked")
                        else:
                            self.log_test("Free Content Access Control", False, 
                                        "Free content should show media URLs and not be locked", free_item)
                    
                    if locked_content:
                        locked_item = locked_content[0]
                        if locked_item['is_locked'] and not locked_item['media_urls']:
                            self.log_test("Locked Content Access Control", True, 
                                        "Locked content hides media URLs and shows is_locked=true")
                        else:
                            self.log_test("Locked Content Access Control", False, 
                                        "Locked content should hide media URLs and show is_locked=true", locked_item)
                    
                else:
                    self.log_test("Content Discovery - Basic Retrieval", False, 
                                "No content returned or invalid response format", content_list)
                    return False
            else:
                self.log_test("Content Discovery - Basic Retrieval", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Content Discovery - Basic Retrieval", False, f"Error: {str(e)}")
            return False

        # Test 2: Pagination
        try:
            response = self.session.get(f"{BACKEND_URL}/content?skip=0&limit=2")
            if response.status_code == 200:
                limited_content = response.json()
                if len(limited_content) <= 2:
                    self.log_test("Content Pagination", True, 
                                f"Pagination working - returned {len(limited_content)} items with limit=2")
                else:
                    self.log_test("Content Pagination", False, 
                                f"Pagination not working - returned {len(limited_content)} items with limit=2")
            else:
                self.log_test("Content Pagination", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Content Pagination", False, f"Error: {str(e)}")

        return True

    def test_creators_endpoint(self):
        """Test GET /api/creators endpoint"""
        try:
            response = self.session.get(f"{BACKEND_URL}/creators")
            if response.status_code == 200:
                creators_list = response.json()
                
                if isinstance(creators_list, list) and len(creators_list) > 0:
                    self.log_test("Creators Listing", True, 
                                f"Retrieved {len(creators_list)} creators")
                    
                    # Store sample creator IDs for later tests
                    self.sample_creator_ids = [creator['id'] for creator in creators_list[:2]]
                    
                    # Test creator structure
                    first_creator = creators_list[0]
                    required_fields = ['id', 'username', 'display_name', 'is_creator', 
                                     'subscriber_count', 'created_at']
                    
                    missing_fields = [field for field in required_fields if field not in first_creator]
                    if not missing_fields:
                        self.log_test("Creator Structure Validation", True, 
                                    "All required fields present in creator response")
                    else:
                        self.log_test("Creator Structure Validation", False, 
                                    f"Missing fields: {missing_fields}", first_creator)
                    
                    # Verify all returned users are creators
                    non_creators = [creator for creator in creators_list if not creator['is_creator']]
                    if not non_creators:
                        self.log_test("Creator Filter Validation", True, 
                                    "All returned users are marked as creators")
                    else:
                        self.log_test("Creator Filter Validation", False, 
                                    f"Found {len(non_creators)} non-creators in creators list")
                    
                    # Test sample data quality
                    creators_with_subscribers = [c for c in creators_list if c['subscriber_count'] > 0]
                    if creators_with_subscribers:
                        self.log_test("Creator Sample Data Quality", True, 
                                    f"{len(creators_with_subscribers)} creators have subscriber data")
                    else:
                        self.log_test("Creator Sample Data Quality", False, 
                                    "No creators have subscriber data")
                    
                else:
                    self.log_test("Creators Listing", False, 
                                "No creators returned or invalid response format", creators_list)
                    return False
            else:
                self.log_test("Creators Listing", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Creators Listing", False, f"Error: {str(e)}")
            return False

        return True

    def test_individual_content(self):
        """Test GET /api/content/{content_id} endpoint"""
        if not self.sample_content_ids:
            self.log_test("Individual Content Access", False, 
                        "No sample content IDs available for testing")
            return False

        # Test valid content ID
        try:
            content_id = self.sample_content_ids[0]
            response = self.session.get(f"{BACKEND_URL}/content/{content_id}")
            
            if response.status_code == 200:
                content_item = response.json()
                
                # Verify structure
                required_fields = ['id', 'creator_id', 'title', 'content_type', 'is_free', 'is_locked']
                missing_fields = [field for field in required_fields if field not in content_item]
                
                if not missing_fields:
                    self.log_test("Individual Content - Valid ID", True, 
                                f"Successfully retrieved content: {content_item['title']}")
                    
                    # Test access control for individual content
                    if content_item['is_free']:
                        if not content_item['is_locked'] and content_item.get('media_urls'):
                            self.log_test("Individual Content - Free Access Control", True, 
                                        "Free content accessible with media URLs")
                        else:
                            self.log_test("Individual Content - Free Access Control", False, 
                                        "Free content should be accessible with media URLs", content_item)
                    else:
                        if content_item['is_locked'] and not content_item.get('media_urls'):
                            self.log_test("Individual Content - Locked Access Control", True, 
                                        "Locked content properly restricted")
                        else:
                            self.log_test("Individual Content - Locked Access Control", False, 
                                        "Locked content should hide media URLs", content_item)
                else:
                    self.log_test("Individual Content - Valid ID", False, 
                                f"Missing fields: {missing_fields}", content_item)
            else:
                self.log_test("Individual Content - Valid ID", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Individual Content - Valid ID", False, f"Error: {str(e)}")

        # Test invalid content ID
        try:
            invalid_id = "invalid-content-id-12345"
            response = self.session.get(f"{BACKEND_URL}/content/{invalid_id}")
            
            if response.status_code == 404:
                self.log_test("Individual Content - Invalid ID Error Handling", True, 
                            "Properly returns 404 for invalid content ID")
            else:
                self.log_test("Individual Content - Invalid ID Error Handling", False, 
                            f"Expected 404, got HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Individual Content - Invalid ID Error Handling", False, f"Error: {str(e)}")

        return True

    def test_content_filtering(self):
        """Test content filtering by creator"""
        if not self.sample_creator_ids:
            self.log_test("Content Filtering by Creator", False, 
                        "No sample creator IDs available for testing")
            return False

        try:
            creator_id = self.sample_creator_ids[0]
            response = self.session.get(f"{BACKEND_URL}/content?creator_id={creator_id}")
            
            if response.status_code == 200:
                filtered_content = response.json()
                
                if isinstance(filtered_content, list):
                    # Verify all content belongs to the specified creator
                    wrong_creator_content = [item for item in filtered_content 
                                           if item['creator_id'] != creator_id]
                    
                    if not wrong_creator_content:
                        self.log_test("Content Filtering by Creator", True, 
                                    f"Successfully filtered {len(filtered_content)} items by creator")
                    else:
                        self.log_test("Content Filtering by Creator", False, 
                                    f"Found {len(wrong_creator_content)} items from wrong creator")
                else:
                    self.log_test("Content Filtering by Creator", False, 
                                "Invalid response format for filtered content", filtered_content)
            else:
                self.log_test("Content Filtering by Creator", False, 
                            f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Content Filtering by Creator", False, f"Error: {str(e)}")

        return True

    def test_sample_data_creation(self):
        """Test that sample data is created automatically"""
        # This is implicitly tested by other endpoints, but we can verify the expected data exists
        try:
            # Check that we have the expected number of creators (3)
            creators_response = self.session.get(f"{BACKEND_URL}/creators")
            if creators_response.status_code == 200:
                creators = creators_response.json()
                if len(creators) >= 3:
                    self.log_test("Sample Data - Creators Count", True, 
                                f"Found {len(creators)} creators (expected 3+)")
                else:
                    self.log_test("Sample Data - Creators Count", False, 
                                f"Found only {len(creators)} creators (expected 3+)")

            # Check that we have mixed free/paid content
            content_response = self.session.get(f"{BACKEND_URL}/content")
            if content_response.status_code == 200:
                content_list = content_response.json()
                free_content = [item for item in content_list if item['is_free']]
                paid_content = [item for item in content_list if not item['is_free']]
                
                if free_content and paid_content:
                    self.log_test("Sample Data - Mixed Content Types", True, 
                                f"Found {len(free_content)} free and {len(paid_content)} paid content items")
                else:
                    self.log_test("Sample Data - Mixed Content Types", False, 
                                f"Missing content variety: {len(free_content)} free, {len(paid_content)} paid")
        except Exception as e:
            self.log_test("Sample Data Creation", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Backend API Tests for Content Monetization Platform")
        print(f"Testing against: {BACKEND_URL}")
        print("=" * 70)
        
        # Test API connectivity first
        if not self.test_api_root():
            print("❌ API is not accessible. Stopping tests.")
            return False
        
        # Run all test suites
        self.test_sample_data_creation()
        self.test_content_discovery()
        self.test_creators_endpoint()
        self.test_individual_content()
        self.test_content_filtering()
        
        # Summary
        print("=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for test in self.test_results:
                if not test['success']:
                    print(f"  • {test['test']}: {test['details']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)