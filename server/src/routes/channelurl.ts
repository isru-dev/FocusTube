import { Router } from "express";
import type { Request, Response } from 'express';
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

function extractHandle(input: string): string {
  const trimmed = input.trim();
  
  const urlMatch = trimmed.match(/youtube\.com\/@([\w.-]+)/);
  
  if (urlMatch) {
    return urlMatch[1];
  }

  return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
}
router.post('/',requireAuth,(req:Request,res:Response)=>{
  const {url}=req.body;
extractHandle(url);


});