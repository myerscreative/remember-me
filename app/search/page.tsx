"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Filter, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const mockSearchResults = [
  {
    id: "1",
    name: "Alice Johnson",
    initials: "AJ",
    tags: ["Friend", "Work"],
    lastContact: "2 days ago",
    email: "alice@example.com",
  },
  {
    id: "2",
    name: "Bob Smith",
    initials: "BS",
    tags: ["Family"],
    lastContact: "1 week ago",
    email: "bob@example.com",
  },
];

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const allTags = ["Friend", "Family", "Work", "Hobby", "Client", "Neighbor"];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Search className="h-8 w-8" />
          Search
        </h1>
        <p className="text-muted-foreground">
          Find contacts with advanced filters
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, phone, or notes..."
          className="pl-9 pr-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-8 w-8"
            onClick={() => setSearchTerm("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Toggle */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter className="h-4 w-4 mr-2" />
        {showFilters ? "Hide" : "Show"} Filters
        {selectedTags.length > 0 && (
          <Badge variant="secondary" className="ml-2">
            {selectedTags.length}
          </Badge>
        )}
      </Button>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Tags Filter */}
            <div className="space-y-2">
              <Label>Filter by Tags</Label>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Last Contact</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  Last 7 days
                </Button>
                <Button variant="outline" size="sm">
                  Last 30 days
                </Button>
                <Button variant="outline" size="sm">
                  Last 3 months
                </Button>
                <Button variant="outline" size="sm">
                  Over 6 months
                </Button>
              </div>
            </div>

            {/* Clear Filters */}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setSelectedTags([])}
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Selected Filters Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleTag(tag)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {searchTerm || selectedTags.length > 0
              ? "Search Results"
              : "All Contacts"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {mockSearchResults.length} found
          </span>
        </div>

        {mockSearchResults.map((contact) => (
          <Link key={contact.id} href={`/contacts/${contact.id}`}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {contact.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{contact.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last contact: {contact.lastContact}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {contact.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {searchTerm && mockSearchResults.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No results found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search terms or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

