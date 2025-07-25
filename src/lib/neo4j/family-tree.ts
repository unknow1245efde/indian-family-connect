
import { FamilyTree } from '@/types';
import { runQuery } from './connection';

export const createFamilyTree = async (treeData: Partial<FamilyTree>): Promise<FamilyTree> => {
  const cypher = `
    CREATE (ft:FamilyTree {
      familyTreeId: $familyTreeId,
      createdBy: $createdBy,
      createdAt: $createdAt
    })
    RETURN ft
  `;
  
  const result = await runQuery(cypher, treeData);
  if (result && result.length > 0) {
    return result[0].ft.properties as FamilyTree;
  }
  throw new Error('Failed to create family tree');
};

export const getFamilyTree = async (familyTreeId: string): Promise<FamilyTree | null> => {
  const cypher = `
    MATCH (ft:FamilyTree {familyTreeId: $familyTreeId})
    RETURN ft
  `;
  
  const result = await runQuery(cypher, { familyTreeId });
  if (result && result.length > 0) {
    return result[0].ft.properties as FamilyTree;
  }
  return null;
};

export const getFamilyMembers = async (familyTreeId: string) => {
  try {
    console.log(`Fetching family members for tree: ${familyTreeId}`);
    
    // Query to get all users in a family tree including relationship info - fixed to prevent duplicates
    const cypher = `
      MATCH (u:User {familyTreeId: $familyTreeId})
      OPTIONAL MATCH (creator:User)-[r:RELATES_TO]->(u)
      WITH u, creator, collect(r.relationship)[0] AS relationship
      RETURN DISTINCT u.userId AS userId, u.name AS name, u.email AS email, u.status AS status, 
             u.myRelationship as myRelationship, relationship AS relationship, creator.userId AS createdBy,
             u.profilePicture as profilePicture
    `;
    
    const result = await runQuery(cypher, { familyTreeId });
    console.log(`Found ${result.length} family members`);
    
    return result.map(record => ({
      userId: record.userId,
      name: record.name,
      email: record.email,
      status: record.status,
      myRelationship: record.myRelationship,
      relationship: record.relationship ? record.relationship.toLowerCase() : null,
      createdBy: record.createdBy,
      profilePicture: record.profilePicture
    }));
  } catch (error) {
    console.error("Error fetching family members:", error);
    return [];
  }
};

// Get the relationships between members in a family tree - updated for RELATES_TO
export const getFamilyRelationships = async (familyTreeId: string) => {
  try {
    console.log(`Fetching family relationships for tree: ${familyTreeId}`);
    
    const cypher = `
      MATCH (u1:User {familyTreeId: $familyTreeId})-[r:RELATES_TO]->(u2:User {familyTreeId: $familyTreeId})
      RETURN u1.userId AS source, u2.userId AS target, r.relationship AS type, 
             u1.name AS sourceName, u2.name AS targetName
    `;
    
    const result = await runQuery(cypher, { familyTreeId });
    console.log(`Found ${result.length} relationships`);
    
    return result.map(record => ({
      source: record.source,
      target: record.target,
      type: record.type.toLowerCase(),
      sourceName: record.sourceName,
      targetName: record.targetName
    }));
  } catch (error) {
    console.error("Error fetching family relationships:", error);
    return [];
  }
};

// Create reciprocal relationships between family members - updated for RELATES_TO
export const createReciprocalRelationship = async (familyTreeId: string, userId1: string, userId2: string, relationship1: string, relationship2: string) => {
  try {
    const cypher = `
      MATCH (u1:User {familyTreeId: $familyTreeId, userId: $userId1})
      MATCH (u2:User {familyTreeId: $familyTreeId, userId: $userId2})
      // First clear any existing relationships to avoid duplicates
      OPTIONAL MATCH (u1)-[r1:RELATES_TO]->(u2)
      OPTIONAL MATCH (u2)-[r2:RELATES_TO]->(u1)
      DELETE r1, r2
      // Now create the new relationships
      WITH u1, u2
      CREATE (u1)-[r1:RELATES_TO {relationship: $relationship1}]->(u2)
      CREATE (u2)-[r2:RELATES_TO {relationship: $relationship2}]->(u1)
      RETURN r1.relationship as rel1, r2.relationship as rel2
    `;
    
    const result = await runQuery(cypher, { 
      familyTreeId, 
      userId1, 
      userId2,
      relationship1, 
      relationship2 
    });
    
    if (result && result.length > 0) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error creating reciprocal relationship:", error);
    return false;
  }
};

// Get full family tree visualization data - updated for RELATES_TO
export const getFamilyTreeVisualizationData = async (familyTreeId: string) => {
  try {
    // Get all nodes and relationships in one query
    const cypher = `
      MATCH (u:User {familyTreeId: $familyTreeId})
      OPTIONAL MATCH (u)-[r:RELATES_TO]->(other:User {familyTreeId: $familyTreeId})
      RETURN u.userId AS id, u.name AS name, u.status AS status, u.myRelationship AS myRelationship,
             u.profilePicture AS profilePicture, collect({target: other.userId, type: r.relationship}) AS relationships
    `;
    
    const result = await runQuery(cypher, { familyTreeId });
    
    // Format data for visualization
    const nodes = result.map(record => ({
      id: record.id,
      name: record.name,
      status: record.status,
      myRelationship: record.myRelationship,
      profilePicture: record.profilePicture
    }));
    
    // Extract all relationships
    const links: any[] = [];
    result.forEach(record => {
      if (record.relationships) {
        record.relationships.forEach((rel: any) => {
          if (rel.target) {
            links.push({
              source: record.id,
              target: rel.target,
              type: rel.type ? rel.type.toLowerCase() : 'family'
            });
          }
        });
      }
    });
    
    return { nodes, links };
  } catch (error) {
    console.error("Error getting family tree visualization data:", error);
    return { nodes: [], links: [] };
  }
};

// Get personal family tree view for a specific user
export const getUserPersonalFamilyView = async (userId: string, familyTreeId: string) => {
  try {
    console.log(`Getting personal family view for user ${userId}`);
    
    const cypher = `
      MATCH (viewer:User {userId: $userId, familyTreeId: $familyTreeId})
      MATCH (member:User {familyTreeId: $familyTreeId})
      OPTIONAL MATCH (viewer)-[rel:RELATES_TO]->(member)
      RETURN member.userId as userId, member.name as name, member.email as email, 
             member.status as status, member.profilePicture as profilePicture,
             rel.relationship as relationship
    `;
    
    const result = await runQuery(cypher, { userId, familyTreeId });
    
    return result.map(record => ({
      userId: record.userId,
      name: record.name,
      email: record.email,
      status: record.status,
      profilePicture: record.profilePicture,
      relationship: record.relationship || null
    }));
  } catch (error) {
    console.error(`Error getting personal family view for user ${userId}:`, error);
    return [];
  }
};
